import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { PERMISSIONS, Permission } from "./permissions.client";

export { PERMISSIONS, type Permission };

export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return false;
  }

  // Superadmin has all permissions
  if (session.user.role === "SUPERADMIN") {
    return true;
  }

  // Tenant owner (has the 'Owner' role) has all permissions essentially, but let's check explicitly
  const userPermissions = session.user.permissions || [];
  
  return userPermissions.includes(permission);
}

export async function requirePermission(permission: Permission) {
  const isAuthorized = await hasPermission(permission);
  
  if (!isAuthorized) {
    throw new Error(`Unauthorized: Requires ${permission} permission.`);
  }
}


