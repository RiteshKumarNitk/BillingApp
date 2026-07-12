import prisma from "@/lib/prisma";
import type { PrismaClient } from "../generated/prisma";

// Accepts either the default prisma client or an interactive-transaction client (`tx`), so
// callers can re-run these checks inside a `prisma.$transaction(...)` for a tight race window.
type QueryClient = Pick<PrismaClient, "tenant" | "product" | "user" | "transaction">;

export interface ActiveSubscriptionInfo {
  status: string;
  planName: string;
  endDate: Date;
  trialEndDate?: Date | null;
  cancelAtPeriodEnd: boolean;
  maxProducts: number;
  maxUsers: number;
  maxTransactions: number;
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
    maxTransactions: sub.plan.maxTransactions
  };
}

export async function checkFeatureLimit(
  tenantId: string,
  feature: "products" | "users" | "transactions",
  client: QueryClient = prisma
): Promise<{ allowed: boolean; reason?: string }> {
  // Try to get subscription
  const activeSub = await getActiveSubscription(tenantId, client);
  
  // If no active subscription, we fetch or assume default FREE plan configuration
  const defaultFreePlan = {
    planName: "FREE",
    maxProducts: 10,
    maxUsers: 2,
    maxTransactions: 20
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
        reason: `Product limit reached (${plan.maxProducts} allowed on your current plan: ${plan.planName || "FREE"}). Please upgrade to add more products.`
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
        reason: `User limit reached (${plan.maxUsers} allowed on your current plan: ${plan.planName || "FREE"}). Please upgrade to add more team members.`
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
        reason: `Monthly transactions limit reached (${plan.maxTransactions} allowed on your current plan: ${plan.planName || "FREE"}). Please upgrade to create more bills.`
      };
    }
  }

  return { allowed: true };
}
