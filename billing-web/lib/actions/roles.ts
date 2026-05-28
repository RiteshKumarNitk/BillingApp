"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { requirePermission, PERMISSIONS, Permission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getRoles() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const roles = await (prisma as any).role.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return roles;
}

export async function createRole(name: string, permissions: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (!name.trim()) throw new Error("Role name is required");

  // Filter out invalid permissions just in case
  const validPermissions = permissions.filter(p => Object.keys(PERMISSIONS).includes(p));

  const role = await (prisma as any).role.create({
    data: {
      name: name.trim(),
      permissions: validPermissions,
      tenantId: session.user.tenantId
    }
  });

  revalidatePath('/roles');
  return role;
}

export async function updateRole(roleId: string, name: string, permissions: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (!name.trim()) throw new Error("Role name is required");

  // Prevent editing the default "Owner" role
  const existingRole = await (prisma as any).role.findUnique({ where: { id: roleId } });
  if (existingRole?.name === 'Owner') {
    throw new Error("Cannot edit the default Owner role");
  }

  const validPermissions = permissions.filter(p => Object.keys(PERMISSIONS).includes(p));

  const role = await (prisma as any).role.update({
    where: { id: roleId, tenantId: session.user.tenantId },
    data: {
      name: name.trim(),
      permissions: validPermissions,
    }
  });

  revalidatePath('/roles');
  return role;
}

export async function deleteRole(roleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission('MANAGE_USERS');

  const role = await (prisma as any).role.findUnique({
    where: { id: roleId, tenantId: session.user.tenantId },
    include: { _count: { select: { users: true } } }
  });

  if (!role) throw new Error("Role not found");
  if (role.name === 'Owner') throw new Error("Cannot delete the Owner role");
  if (role._count.users > 0) throw new Error("Cannot delete a role that is assigned to users");

  await (prisma as any).role.delete({
    where: { id: roleId }
  });

  revalidatePath('/roles');
}
