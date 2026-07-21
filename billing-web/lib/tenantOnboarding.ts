import type { Prisma } from "../generated/prisma";
import { DEFAULT_THEME_ID, getThemeDefaultConfig } from "@/lib/website/themeDefaults";

// Shared by both tenant-creation paths (public self-serve signup and the superadmin console),
// which had drifted into two independent copies of this same role list before CafeOS Phase 2.
export const DEFAULT_ROLE_DEFINITIONS = [
  { name: "Owner", permissions: ["CREATE_PRODUCT", "EDIT_PRODUCT", "DELETE_PRODUCT", "VIEW_REPORTS", "CREATE_BILL", "MANAGE_USERS", "VIEW_PROFIT", "OVERRIDE_PRICE"] },
  { name: "Manager", permissions: ["CREATE_PRODUCT", "EDIT_PRODUCT", "VIEW_REPORTS", "CREATE_BILL", "VIEW_PROFIT", "OVERRIDE_PRICE"] },
  { name: "Cashier", permissions: ["CREATE_BILL", "VIEW_PRODUCT"] },
] as const;

// Creates the standard Owner/Manager/Cashier roles for a newly created tenant and returns the
// Owner role's id (the id the first admin User row should be linked to).
export async function createDefaultRoles(
  db: Prisma.TransactionClient,
  tenantId: string
): Promise<string> {
  let ownerRoleId: string | null = null;
  for (const roleData of DEFAULT_ROLE_DEFINITIONS) {
    const role = await db.role.create({
      data: {
        name: roleData.name,
        permissions: [...roleData.permissions],
        tenantId,
      },
    });
    if (role.name === "Owner") {
      ownerRoleId = role.id;
    }
  }
  // Owner is always first in DEFAULT_ROLE_DEFINITIONS, so this never actually happens — satisfies
  // the return type without a non-null assertion.
  if (!ownerRoleId) {
    throw new Error("Failed to create Owner role");
  }
  return ownerRoleId;
}

// A new tenant previously landed with no Shop row (so receipt/tax settings were unset until
// someone visited Settings) and no Website row (site unconfigured until someone visited the
// Website Builder). CafeOS tenants should be able to start selling and show a real site
// immediately, so both are seeded at creation time. Idempotent-ish via `skipDuplicates` semantics
// aren't available on create-with-unique here, so callers should only call this once per tenant
// (both onboarding paths call it exactly once, right after `tenant.create`).
export async function seedTenantWorkspaceDefaults(
  db: Prisma.TransactionClient,
  tenant: { id: string; name: string; aboutText?: string | null }
): Promise<void> {
  await db.shop.create({
    data: {
      tenantId: tenant.id,
      name: tenant.name,
    },
  });

  const defaultConfig = getThemeDefaultConfig(DEFAULT_THEME_ID, { name: tenant.name, aboutText: tenant.aboutText });
  await db.website.create({
    data: {
      tenantId: tenant.id,
      theme: defaultConfig.theme,
      appearance: defaultConfig.appearance as any,
      sections: defaultConfig.sections as any,
    },
  });
}
