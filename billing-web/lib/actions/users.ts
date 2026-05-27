"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getTenantUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  if (session.user.role === 'SUPERADMIN') {
    // Superadmin can see all users in the system
    return await prisma.user.findMany({
      include: { tenantRole: true, tenant: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Regular tenant users only see users in their tenant
  return await prisma.user.findMany({
    where: { tenantId: session.user.tenantId },
    include: { tenantRole: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createTenantUser(data: { name: string, email: string, password: string, tenantRoleId?: string, phone?: string, isSuperAdminUser?: boolean }) {
  const session = await getServerSession(authOptions);
  
  if (data.isSuperAdminUser) {
    if (session?.user?.role !== 'SUPERADMIN') throw new Error("Unauthorized");
    
    if (!data.name || !data.email || !data.password) {
      throw new Error("Missing required fields");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        password: hashedPassword,
        role: 'SUPERADMIN'
      }
    });

    revalidatePath('/users');
    return { id: user.id, name: user.name, email: user.email };
  }

  // Tenant user creation path
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (!data.name || !data.email || !data.password || !data.tenantRoleId) {
    throw new Error("Missing required fields");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Verify the role belongs to this tenant
  const role = await prisma.role.findUnique({
    where: { id: data.tenantRoleId, tenantId: session.user.tenantId }
  });
  if (!role) throw new Error("Invalid role selected");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      password: hashedPassword,
      tenantId: session.user.tenantId,
      tenantRoleId: role.id,
      role: 'USER' // Global role is just USER
    }
  });

  revalidatePath('/users');
  return { id: user.id, name: user.name, email: user.email };
}

export async function deleteTenantUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (userId === session.user.id) {
    throw new Error("You cannot delete yourself");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, tenantId: session.user.tenantId }
  });

  if (!user) throw new Error("User not found");

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath('/users');
}
