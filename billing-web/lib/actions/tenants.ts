"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

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
    subscriptionPlan: data.subscriptionPlan || 'FREE',
    logoUrl: data.logoUrl || null,
    website: data.website || null,
    currency: data.currency || 'INR',
    timezone: data.timezone || 'Asia/Kolkata',
    aadharCardUrl: data.aadharCardUrl || null
  };

  const tenant = await prisma.tenant.create({ data: tenantCreateData });

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
    subscriptionPlan: data.subscriptionPlan || 'FREE'
  };

  const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: updateTenantData });

  // If a new password was provided, update the tenant's admin user
  if (data.password && data.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Find the primary admin for this tenant and update their password
    // We assume the admin has role 'ADMIN' or is the first user
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' }
    });
    
    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword }
      });
    }
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

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: newStatus }
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
