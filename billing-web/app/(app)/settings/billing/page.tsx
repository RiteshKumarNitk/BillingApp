import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/auth/login");
  }
  const tenantId = session.user.tenantId;

  // 1. Fetch Tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) redirect("/dashboard");

  // 2. Fetch Active subscription and list of all subscriptions
  const subscriptions = await prisma.tenantSubscription.findMany({
    where: { tenantId },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });

  const activeSub = subscriptions.find(s => ["ACTIVE", "TRIAL", "PAST_DUE"].includes(s.status));

  // 3. Fetch Invoices / Payment History
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" }
  });

  // 4. Fetch available Plans
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { amount: "asc" }
  });

  // 5. Fetch current usage stats for limit checking
  const productCount = await prisma.product.count({ where: { tenantId } });
  const userCount = await prisma.user.count({ where: { tenantId } });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const transactionCount = await prisma.transaction.count({
    where: {
      tenantId,
      status: { not: 'HELD' },
      createdAt: { gte: startOfMonth }
    }
  });

  const usage = {
    products: productCount,
    users: userCount,
    transactions: transactionCount
  };

  return (
    <div className="font-sans max-w-6xl mx-auto py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your SaaS plan, view payment invoices, and track resource limits</p>
      </header>

      <BillingClient 
        tenant={tenant}
        activeSub={activeSub}
        subscriptions={subscriptions}
        invoices={invoices}
        plans={plans}
        usage={usage}
      />
    </div>
  );
}
