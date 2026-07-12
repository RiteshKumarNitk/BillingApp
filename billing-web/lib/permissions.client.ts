export const PERMISSIONS = {
  CREATE_PRODUCT: "CREATE_PRODUCT",
  EDIT_PRODUCT: "EDIT_PRODUCT",
  DELETE_PRODUCT: "DELETE_PRODUCT",
  VIEW_REPORTS: "VIEW_REPORTS",
  CREATE_BILL: "CREATE_BILL",
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_PROFIT: "VIEW_PROFIT",
  OVERRIDE_PRICE: "OVERRIDE_PRICE",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasClientPermission(session: any, permission: Permission): boolean {
  if (!session?.user) {
    return false;
  }

  if (session.user.role === "SUPERADMIN") {
    return true;
  }

  const userPermissions = session.user.permissions || [];
  return userPermissions.includes(permission);
}
