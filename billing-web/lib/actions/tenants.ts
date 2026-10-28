"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, clearSessionStateCache } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/publicCache";
import bcrypt from "bcryptjs";
import { toUrlSlug } from "@/lib/website/slug";
import { createDefaultRoles, seedTenantWorkspaceDefaults } from "@/lib/tenantOnboarding";
import { sendEmail, EmailTemplates } from "@/lib/mail";
import { SITE_URL } from "@/lib/marketing/seo";

const VALID_BUSINESS_TYPES = ['CAFE', 'LAUNDRY', 'SALON'];

async function updateBrandingImpl(data: { primaryColor: string; fontFamily: string }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new UserError("Unauthorized");

  const tenantId = session.user.tenantId;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      primaryColor: data.primaryColor,
      fontFamily: data.fontFamily,
    }
  });

  invalidatePublicCache();
  revalidatePath("/settings/branding");
  return true;
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    throw new UserError("Unauthorized: Superadmin access required");
  }
  return session;
}

async function createTenantImpl(data: any) {
  await requireSuperAdmin();

  // Validate basic data
  if (!data.name || !data.email || !data.password) {
    throw new UserError("Missing required fields (name, email, password)");
  }

  // Check if email or phone already exists
  if (data.email) {
    const existingEmail = await prisma.tenant.findFirst({ where: { email: data.email } });
    if (existingEmail) {
      throw new UserError("A tenant with this email already exists.");
    }
  }
  if (data.phone) {
    const existingPhone = await prisma.tenant.findFirst({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new UserError("A tenant with this phone number already exists.");
    }
  }

  // Fetch the selected subscription plan
  const planName = data.subscriptionPlan || 'Starter';
  const selectedPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: planName }
  });
  
  if (!selectedPlan) {
    throw new UserError(`Invalid subscription plan selected: ${planName}`);
  }

  // Generate unique domain
  let baseDomain = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  if (!baseDomain) baseDomain = 'tenant';
  
  let domain = `${baseDomain}.example.com`;
  
  // Check if domain exists to prevent unique constraint violation
  let isUnique = false;
  let counter = 1;
  while (!isUnique) {
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain }
    });
    if (existingTenant) {
      domain = `${baseDomain}${counter}.example.com`;
      counter++;
    } else {
      isUnique = true;
    }
  }

  // Create tenant
  const tenantCreateData: any = {
    name: data.name,
    domain: domain,
    status: 'ACTIVE',
    contactPerson: data.contactPerson || null,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    gstin: data.gstin || null,
    subscriptionPlan: selectedPlan.name,
    logoUrl: data.logoUrl || null,
    website: data.website || null,
    websiteSlug: data.websiteSlug || toUrlSlug(data.name),
    currency: data.currency || 'INR',
    timezone: data.timezone || 'Asia/Kolkata',
    aadharCardUrl: data.aadharCardUrl || null,
    businessType: VALID_BUSINESS_TYPES.includes(data.businessType) ? data.businessType : null,
  };

  // Process Discount Code if provided (validated up front — a bad coupon must fail BEFORE any
  // rows are written, not half-way through the creation transaction)
  let coupon = null;
  let discountAmount = 0;
  let netAmount = selectedPlan.amount;
  let status = "ACTIVE";
  const startDate = new Date();
  let endDate = new Date();

  if (selectedPlan.interval === 'YEARLY') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  if (selectedPlan.amount > 0) {
    if (selectedPlan.trialDays > 0) {
      status = "TRIAL";
      endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.trialDays);
    } else {
      status = "UNPAID";
    }
  }

  if (data.discountCode && data.discountCode.trim() !== '') {
    coupon = await prisma.coupon.findUnique({
      where: { code: data.discountCode.trim().toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      throw new UserError("Invalid or inactive discount code.");
    }
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new UserError("Discount code has expired.");
    }
    if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
      throw new UserError("Discount code redemption limit reached.");
    }

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (selectedPlan.amount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    netAmount = Math.max(0, selectedPlan.amount - discountAmount);

    if (netAmount === 0 && selectedPlan.amount > 0) {
      status = "ACTIVE"; // Fully discounted to 0
    }
  }

  // Everything below happens in ONE transaction — tenant, shop/website workspace defaults,
  // subscription, invoice, coupon redemption, default roles, and the owner user. A failure at
  // any step rolls the whole creation back instead of orphaning a tenant with no login (the
  // previous behavior). bcrypt hashing is CPU-bound, so it's done up front outside the
  // transaction to keep the write window as short as possible.
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({ data: tenantCreateData });
    await seedTenantWorkspaceDefaults(tx, createdTenant);

    // Create initial subscription for the new tenant
    const subscription = await tx.tenantSubscription.create({
      data: {
        tenantId: createdTenant.id,
        planId: selectedPlan.id,
        status: status,
        startDate: startDate,
        endDate: endDate,
        ...(status === 'TRIAL' ? { trialStartDate: startDate, trialEndDate: endDate } : {})
      }
    });

    // Create an initial invoice if there is a plan amount or discount applied
    if (selectedPlan.amount > 0 || coupon) {
      await tx.invoice.create({
        data: {
          tenantId: createdTenant.id,
          subscriptionId: subscription.id,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          amount: selectedPlan.amount,
          discountAmount: discountAmount,
          netAmount: netAmount,
          currency: selectedPlan.currency || 'INR',
          status: netAmount === 0 ? "PAID" : "PENDING",
          couponId: coupon?.id,
          ...(netAmount === 0 ? { paidAt: new Date() } : {})
        }
      });

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { redemptions: { increment: 1 } }
        });
      }
    }

    // Create default roles
    const ownerRoleId = await createDefaultRoles(tx, createdTenant.id);

    // Create tenant owner user
    await tx.user.create({
      data: {
        name: data.contactPerson || 'Admin User',
        email: data.email,
        phone: data.phone || null,
        password: hashedPassword,
        tenantId: createdTenant.id,
        tenantRoleId: ownerRoleId,
        role: 'ADMIN', // Global role for tenant admin
        profilePictureUrl: data.profilePictureUrl || null,
        jobTitle: data.jobTitle || null
      }
    });

    return createdTenant;
  });

  // Send the owner their login credentials. Best-effort: the tenant is already fully created and
  // functional, so a mailer outage logs and continues rather than failing the whole signup.
  const loginUrl = `${SITE_URL}/auth/login`;
  const emailResult = await sendEmail({
    to: data.email,
    subject: `Your ${tenant.name} CafeOS account is ready`,
    html: EmailTemplates.OwnerWelcome(
      data.contactPerson || 'Admin User',
      tenant.name,
      data.email,
      data.password,
      loginUrl
    ),
  });
  if (!emailResult.success) {
    console.error(`[createTenant] Welcome email to ${data.email} failed:`, emailResult.error);
  }

  invalidatePublicCache();
  revalidatePath('/tenants');
  return tenant;
}

async function updateTenantImpl(tenantId: string, data: any) {
  await requireSuperAdmin();

  const updateTenantData: any = {
    name: data.name,
    contactPerson: data.contactPerson || null,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    gstin: data.gstin || null,
    subscriptionPlan: data.subscriptionPlan || 'Starter',
    logoUrl: data.logoUrl || null,
    website: data.website || null,
    websiteSlug: data.websiteSlug || null,
    currency: data.currency || 'INR',
    timezone: data.timezone || 'Asia/Kolkata',
    aadharCardUrl: data.aadharCardUrl || null
  };

  const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: updateTenantData });

  // If a new password was provided, update the tenant's admin user and invalidate their session
  if (data.password && data.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' }
    });
    
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword, tokenVersion: { increment: 1 }, sessionsValidAfter: new Date() }
      });
      clearSessionStateCache();
    }
  }

  // Update admin user profile fields if provided
  if (data.profilePictureUrl || data.jobTitle) {
    const updateUserData: any = {};
    if (data.profilePictureUrl) updateUserData.profilePictureUrl = data.profilePictureUrl;
    if (data.jobTitle) updateUserData.jobTitle = data.jobTitle;

    await prisma.user.updateMany({
      where: { tenantId, role: 'ADMIN' },
      data: updateUserData
    });
  }

  invalidatePublicCache();
  revalidatePath('/tenants');
  invalidatePublicCache();
  revalidatePath(`/tenants/${tenantId}`);
  return tenant;
}

async function toggleTenantStatusImpl(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new UserError("Tenant not found");

  const newStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  // Bump version to invalidate all active sessions for this tenant
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: newStatus, version: { increment: 1 } }
  });
  clearSessionStateCache();

  invalidatePublicCache();
  revalidatePath('/tenants');
  invalidatePublicCache();
  revalidatePath(`/tenants/${tenantId}`);
  
  return newStatus;
}

export async function updateTenantTheme(theme: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new UserError("Unauthorized");
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { menuTheme: theme }
  });

  invalidatePublicCache();
  revalidatePath('/settings/menu');
  return true;
}

export interface MenuContentInput {
  tagline?: string;
  aboutText?: string;
  coverImageUrl?: string;
  businessHours?: string;
  logoUrl?: string;
  shopFrontImageUrl?: string;
  ownerImageUrl?: string;
}

async function updateMenuContentImpl(data: MenuContentInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new UserError("Unauthorized");
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    throw new UserError("Forbidden - only the store owner can edit the website");
  }

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      tagline: data.tagline?.trim() || null,
      aboutText: data.aboutText?.trim() || null,
      coverImageUrl: data.coverImageUrl?.trim() || null,
      businessHours: data.businessHours?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
      shopFrontImageUrl: data.shopFrontImageUrl?.trim() || null,
      ownerImageUrl: data.ownerImageUrl?.trim() || null,
    }
  });

  invalidatePublicCache();
  revalidatePath(`/site/${session.user.tenantId}`);
  invalidatePublicCache();
  revalidatePath(`/site/${session.user.tenantId}/about`);
  return true;
}

async function deleteTenantImpl(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new UserError("Tenant not found");

  await prisma.tenant.delete({
    where: { id: tenantId }
  });

  invalidatePublicCache();
  revalidatePath('/tenants');
  return true;
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const updateBranding = serverAction("updateBranding", updateBrandingImpl);
export const createTenant = serverAction("createTenant", createTenantImpl);
export const updateTenant = serverAction("updateTenant", updateTenantImpl);
export const toggleTenantStatus = serverAction("toggleTenantStatus", toggleTenantStatusImpl);
export const updateMenuContent = serverAction("updateMenuContent", updateMenuContentImpl);
export const deleteTenant = serverAction("deleteTenant", deleteTenantImpl);
