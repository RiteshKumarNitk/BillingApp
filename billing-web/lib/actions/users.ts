"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, clearSessionStateCache } from "@/lib/auth/nextauth";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { checkFeatureLimit } from "@/lib/subscription";
import bcrypt from "bcryptjs";

// Lets a client component (e.g. the billing cart) check the current user's role/permissions
// for UI gating — mirrors what's already on the session JWT (token.role/token.permissions) but
// client components can't read the server session directly.
export async function getMyPermissions() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { role: null as string | null, permissions: [] as string[] };
  }
  return {
    role: session.user.role as string,
    permissions: (session.user.permissions as string[]) || [],
  };
}

export async function getTenantUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  if (session.user.role === 'SUPERADMIN') {
    // Superadmin can see all users in the system
    return await prisma.user.findMany({
      include: { tenantRole: true, tenant: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Regular tenant users only see users in their tenant — and only with MANAGE_USERS (U4: this
  // returns every team member's name/email/phone, so it's gated like the /users page itself).
  await requirePermission('MANAGE_USERS');
  return await prisma.user.findMany({
    where: { tenantId: session.user.tenantId },
    include: { tenantRole: true },
    orderBy: { createdAt: 'desc' }
  });
}

async function createTenantUserImpl(data: { name: string, email: string, password: string, tenantRoleId?: string, phone?: string, isSuperAdminUser?: boolean, tenantId?: string }) {
  const session = await getServerSession(authOptions);
  
  if (data.isSuperAdminUser) {
    if (session?.user?.role !== 'SUPERADMIN') throw new UserError("Unauthorized");
    
    if (!data.name || !data.email || !data.password) {
      throw new UserError("Missing required fields");
    }

    if (data.password.length < 6) {
      throw new UserError("Password must be at least 6 characters");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new UserError("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createUserData: any = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      password: hashedPassword,
      role: 'SUPERADMIN',
      tenant: { connect: { id: session.user.tenantId } }
    };

    const user = await prisma.user.create({ data: createUserData });

    revalidatePath('/users');
    return { id: user.id, name: user.name, email: user.email };
  }

  // Superadmin can create users in any tenant
  if (data.tenantId && session?.user?.role === 'SUPERADMIN') {
    if (!data.name || !data.email || !data.password || !data.tenantRoleId) {
      throw new UserError("Missing required fields");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new UserError("A user with this email already exists");
    }

    // Verify the role belongs to the specified tenant
    const role = await prisma.role.findUnique({
      where: { id: data.tenantRoleId, tenantId: data.tenantId }
    });
    if (!role) throw new UserError("Invalid role selected for this tenant");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createUserData: any = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      password: hashedPassword,
      role: 'ADMIN',
      tenant: { connect: { id: data.tenantId } },
      tenantRole: { connect: { id: role.id } }
    };

    const user = await prisma.user.create({ data: createUserData });

    revalidatePath('/users');
    return { id: user.id, name: user.name, email: user.email };
  }

  // Tenant user creation path
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission('MANAGE_USERS');

  const limitCheck = await checkFeatureLimit(session.user.tenantId, "users");
  if (!limitCheck.allowed) {
    throw new UserError(limitCheck.reason);
  }

  if (!data.name || !data.email || !data.password || !data.tenantRoleId) {
    throw new UserError("Missing required fields");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new UserError("A user with this email already exists");
  }

  // Verify the role belongs to this tenant
  const role = await prisma.role.findUnique({
    where: { id: data.tenantRoleId, tenantId: session.user.tenantId }
  });
  if (!role) throw new UserError("Invalid role selected");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const createTenantUserData: any = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || null,
    password: hashedPassword,
    role: 'USER',
    tenant: { connect: { id: session.user.tenantId } },
    tenantRole: { connect: { id: role.id } }
  };

  const user = await prisma.user.create({ data: createTenantUserData });

  revalidatePath('/users');
  return { id: user.id, name: user.name, email: user.email };
}

async function deleteTenantUserImpl(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (userId === session.user.id) {
    throw new UserError("You cannot delete yourself");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId, tenantId: session.user.tenantId }
  });

  if (!user) throw new UserError("User not found");

  await prisma.user.delete({
    where: { id: userId }
  });

  // Note: deleted user's JWT becomes invalid because the JWT callback
  // re-fetches the user and returns empty token if user not found.
  clearSessionStateCache();

  revalidatePath('/users');
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const createTenantUser = serverAction("createTenantUser", createTenantUserImpl);
export const deleteTenantUser = serverAction("deleteTenantUser", deleteTenantUserImpl);
