"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateBranding(data: { primaryColor: string; fontFamily: string }) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const tenantId = session.user.tenantId;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      primaryColor: data.primaryColor,
      fontFamily: data.fontFamily,
    }
  });

  revalidatePath("/settings/branding");
  return true;
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    throw new Error("Unauthorized: Superadmin access required");
  }
  return session;
}

export async function createTenant(data: any) {
  await requireSuperAdmin();

  // Validate basic data
  if (!data.name || !data.email || !data.password) {
    throw new Error("Missing required fields (name, email, password)");
  }

  // Check if email or phone already exists
  if (data.email) {
    const existingEmail = await prisma.tenant.findFirst({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error("A tenant with this email already exists.");
    }
  }
  if (data.phone) {
    const existingPhone = await prisma.tenant.findFirst({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new Error("A tenant with this phone number already exists.");
    }
  }

  // Fetch the selected subscription plan
  const planName = data.subscriptionPlan || 'FREE';
  const selectedPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: planName }
  });
  
  if (!selectedPlan) {
    throw new Error(`Invalid subscription plan selected: ${planName}`);
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
    dbConnectionString: '',
    status: 'ACTIVE',
    contactPerson: data.contactPerson || null,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    gstin: data.gstin || null,
    subscriptionPlan: selectedPlan.name,
    logoUrl: data.logoUrl || null,
    website: data.website || null,
    currency: data.currency || 'INR',
    timezone: data.timezone || 'Asia/Kolkata',
    aadharCardUrl: data.aadharCardUrl || null
  };

  const tenant = await prisma.tenant.create({ data: tenantCreateData });

  // Create initial subscription for the new tenant
  const startDate = new Date();
  let endDate = new Date();
  let status = "ACTIVE";
  
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

  // Process Discount Code if provided
  let coupon = null;
  let discountAmount = 0;
  let netAmount = selectedPlan.amount;

  if (data.discountCode && data.discountCode.trim() !== '') {
    coupon = await prisma.coupon.findUnique({
      where: { code: data.discountCode.trim().toUpperCase() }
    });
    
    if (!coupon || !coupon.isActive) {
      throw new Error("Invalid or inactive discount code.");
    }
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      throw new Error("Discount code has expired.");
    }
    if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
      throw new Error("Discount code redemption limit reached.");
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

  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      planId: selectedPlan.id,
      status: status,
      startDate: startDate,
      endDate: endDate,
      ...(status === 'TRIAL' ? { trialStartDate: startDate, trialEndDate: endDate } : {})
    }
  });

  // Create an initial invoice if there is a plan amount or discount applied
  if (selectedPlan.amount > 0 || coupon) {
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
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
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { redemptions: { increment: 1 } }
      });
    }
  }

  // Create default roles
  let ownerRoleId = null;
  const rolesData = [
    { name: 'Owner', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT'] },
    { name: 'Manager', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'VIEW_PROFIT'] },
    { name: 'Cashier', permissions: ['CREATE_BILL', 'VIEW_PRODUCT'] }
  ];

  for (const roleData of rolesData) {
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        permissions: roleData.permissions,
        tenantId: tenant.id
      }
    });
    if (role.name === 'Owner') {
      ownerRoleId = role.id;
    }
  }

  // Create tenant owner user
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const createUserData: any = {
    name: data.contactPerson || 'Admin User',
    email: data.email,
    phone: data.phone || null,
    password: hashedPassword,
    tenantId: tenant.id,
    tenantRoleId: ownerRoleId,
    role: 'ADMIN', // Global role for tenant admin
    profilePictureUrl: data.profilePictureUrl || null,
    jobTitle: data.jobTitle || null
  };

  await prisma.user.create({ data: createUserData });

  revalidatePath('/tenants');
  return tenant;
}

export async function updateTenant(tenantId: string, data: any) {
  await requireSuperAdmin();

  const updateTenantData: any = {
    name: data.name,
    contactPerson: data.contactPerson || null,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    gstin: data.gstin || null,
    subscriptionPlan: data.subscriptionPlan || 'FREE',
    logoUrl: data.logoUrl || null,
    website: data.website || null,
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
        data: { password: hashedPassword, tokenVersion: { increment: 1 } }
      });
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

  revalidatePath('/tenants');
  revalidatePath(`/tenants/${tenantId}`);
  return tenant;
}

export async function toggleTenantStatus(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new Error("Tenant not found");

  const newStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  // Bump version to invalidate all active sessions for this tenant
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: newStatus, version: { increment: 1 } }
  });

  revalidatePath('/tenants');
  revalidatePath(`/tenants/${tenantId}`);
  
  return newStatus;
}

export async function updateTenantTheme(theme: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }
  
  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { menuTheme: theme }
  });
  
  revalidatePath('/settings/menu');
  return true;
}

export async function deleteTenant(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) throw new Error("Tenant not found");

  await prisma.tenant.delete({
    where: { id: tenantId }
  });

  revalidatePath('/tenants');
  return true;
}
