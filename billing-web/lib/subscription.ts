import prisma from "@/lib/prisma";
import type { PrismaClient } from "../generated/prisma";

// Accepts either the default prisma client or an interactive-transaction client (`tx`), so
// callers can re-run these checks inside a `prisma.$transaction(...)` for a tight race window.
type QueryClient = Pick<PrismaClient, "tenant" | "product" | "user" | "transaction" | "table">;

// Plan philosophy (see the pricing overhaul this shipped with): a cafe's growth — more menu
// items, more orders, more customers — should never be the thing a plan restricts. maxProducts
// and maxTransactions are kept only for backward compatibility with the -1-means-unlimited
// convention and are set to -1 on every seeded plan; what actually differentiates a tier is
// business capability — staff seats (maxUsers), QR tables (maxTables), and which website themes
// are selectable (allowedThemes, checked separately via checkThemeAllowed below).
export interface ActiveSubscriptionInfo {
  status: string;
  planName: string;
  endDate: Date;
  trialEndDate?: Date | null;
  cancelAtPeriodEnd: boolean;
  maxProducts: number;
  maxUsers: number;
  maxTransactions: number;
  maxTables: number;
  allowedThemes: string[];
}

export async function getActiveSubscription(
  tenantId: string,
  client: QueryClient = prisma
): Promise<ActiveSubscriptionInfo | null> {
  const tenant = await client.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptions: {
        where: {
          status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] },
          endDate: { gte: new Date() }
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true }
      }
    }
  });

  if (!tenant || tenant.subscriptions.length === 0) {
    return null;
  }

  const sub = tenant.subscriptions[0];
  return {
    status: sub.status,
    planName: sub.plan.name,
    endDate: sub.endDate,
    trialEndDate: sub.trialEndDate,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    maxProducts: sub.plan.maxProducts,
    maxUsers: sub.plan.maxUsers,
    maxTransactions: sub.plan.maxTransactions,
    maxTables: sub.plan.maxTables,
    allowedThemes: sub.plan.allowedThemes
  };
}

export async function checkFeatureLimit(
  tenantId: string,
  feature: "products" | "users" | "transactions" | "tables",
  client: QueryClient = prisma
): Promise<{ allowed: boolean; reason?: string }> {
  // Try to get subscription
  const activeSub = await getActiveSubscription(tenantId, client);

  // If no active subscription, assume the entry-tier (Starter) default configuration. Products
  // and transactions are unlimited on every plan (see the module comment above) — only staff
  // seats and tables are ever actually capped.
  const defaultFreePlan = {
    planName: "Starter",
    maxProducts: -1,
    maxUsers: 2,
    maxTransactions: -1,
    maxTables: 10
  };

  const plan = activeSub || defaultFreePlan;

  if (feature === "products") {
    if (plan.maxProducts === -1) return { allowed: true };
    const count = await client.product.count({
      where: { tenantId }
    });
    if (count >= plan.maxProducts) {
      return {
        allowed: false,
        reason: `Product limit reached (${plan.maxProducts} allowed on your current plan: ${plan.planName || "Starter"}). Please upgrade to add more products.`
      };
    }
  }

  if (feature === "users") {
    if (plan.maxUsers === -1) return { allowed: true };
    const count = await client.user.count({
      where: { tenantId }
    });
    if (count >= plan.maxUsers) {
      return {
        allowed: false,
        reason: `User limit reached (${plan.maxUsers} allowed on your current plan: ${plan.planName || "Starter"}). Please upgrade to add more team members.`
      };
    }
  }

  if (feature === "transactions") {
    if (plan.maxTransactions === -1) return { allowed: true };
    
    // Calculate current month's transactions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // HELD bills are unfinished drafts, not completed sales — they shouldn't consume the
    // tenant's monthly transaction quota until (if ever) they're resumed and completed.
    const count = await client.transaction.count({
      where: {
        tenantId,
        status: { not: 'HELD' },
        createdAt: { gte: startOfMonth }
      }
    });

    if (count >= plan.maxTransactions) {
      return {
        allowed: false,
        reason: `Monthly transactions limit reached (${plan.maxTransactions} allowed on your current plan: ${plan.planName || "Starter"}). Please upgrade to create more bills.`
      };
    }
  }

  if (feature === "tables") {
    if (plan.maxTables === -1) return { allowed: true };
    const count = await client.table.count({
      where: { tenantId }
    });
    if (count >= plan.maxTables) {
      return {
        allowed: false,
        reason: `QR table limit reached (${plan.maxTables} allowed on your current plan: ${plan.planName || "Starter"}). Please upgrade to add more tables.`
      };
    }
  }

  return { allowed: true };
}

// No active subscription = treated like the entry tier for theme access too. Two per business-
// type bucket (CAFE: modern-restaurant/minimal-cafe, GENERAL: fashion-store/fresh-harvest) so
// Starter tenants of either type actually get the "2 Website Themes" the pricing page promises —
// see getThemesForBusinessType in lib/website/registry.ts for how a tenant's business type
// narrows this list further before it's ever shown.
export const DEFAULT_STARTER_THEMES = ["modern-restaurant", "minimal-cafe", "fashion-store", "fresh-harvest"];

// Website themes are gated by an allowlist, not a count, so this doesn't fit checkFeatureLimit's
// count-vs-max shape. Empty allowedThemes means "every theme is available" (Professional/
// Enterprise); a non-empty list restricts selection to exactly those theme ids (Starter).
export async function checkThemeAllowed(
  tenantId: string,
  themeId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const activeSub = await getActiveSubscription(tenantId);
  const allowedThemes = activeSub?.allowedThemes ?? DEFAULT_STARTER_THEMES;

  if (allowedThemes.length === 0 || allowedThemes.includes(themeId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `The "${themeId}" theme isn't available on your current plan${activeSub ? ` (${activeSub.planName})` : ""}. Please upgrade to unlock more themes.`
  };
}
