"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, clearSessionStateCache } from "@/lib/auth/nextauth";
import { requirePermission, PERMISSIONS, Permission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getRoles() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  const roles = await prisma.role.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: 'asc' }
  });

  return roles;
}

async function createRoleImpl(name: string, permissions: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (!name.trim()) throw new UserError("Role name is required");

  // Filter out invalid permissions just in case
  const validPermissions = permissions.filter(p => Object.keys(PERMISSIONS).includes(p));  const role = await prisma.role.create({
      data: {
        name: name.trim(),
        permissions: validPermissions,
        tenantId: session.user.tenantId
      }
    });

  revalidatePath('/roles');
  return role;
}

async function updateRoleImpl(roleId: string, name: string, permissions: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission('MANAGE_USERS');

  if (!name.trim()) throw new UserError("Role name is required");

  // Prevent editing the default "Owner" role
  const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (existingRole?.name === 'Owner') {
    throw new UserError("Cannot edit the default Owner role");
  }

  const validPermissions = permissions.filter(p => Object.keys(PERMISSIONS).includes(p));

  const role = await prisma.role.update({
    where: { id: roleId, tenantId: session.user.tenantId },
    data: {
      name: name.trim(),
      permissions: validPermissions,
    }
  });

  // Increment tokenVersion for all users with this role so their sessions refresh
  await prisma.user.updateMany({
    where: { tenantRoleId: roleId },
    data: { tokenVersion: { increment: 1 } }
  });
  clearSessionStateCache();

  revalidatePath('/roles');
  return role;
}

async function deleteRoleImpl(roleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission('MANAGE_USERS');

  const role = await prisma.role.findUnique({
    where: { id: roleId, tenantId: session.user.tenantId },
    include: { _count: { select: { users: true } } }
  });

  if (!role) throw new UserError("Role not found");
  if (role.name === 'Owner') throw new UserError("Cannot delete the Owner role");
  if (role._count.users > 0) throw new UserError("Cannot delete a role that is assigned to users");

  // Increment tokenVersion for users who had this role (they'll lose this role's permissions)
  await prisma.user.updateMany({
    where: { tenantRoleId: roleId },
    data: { tenantRoleId: null, tokenVersion: { increment: 1 } }
  });
  clearSessionStateCache();

  await prisma.role.delete({
    where: { id: roleId }
  });

  revalidatePath('/roles');
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const createRole = serverAction("createRole", createRoleImpl);
export const updateRole = serverAction("updateRole", updateRoleImpl);
export const deleteRole = serverAction("deleteRole", deleteRoleImpl);
