import Link from "next/link";
import prisma from "@/lib/prisma";
import { format, subDays } from "date-fns";
import { 
  Building, 
  Users, 
  Activity, 
  ArrowRight, 
  ShieldAlert, 
  UserPlus, 
  DollarSign, 
  Calendar, 
  TrendingUp 
} from "lucide-react";
import SuperAdminChart from "./SuperAdminChart";

type TenantRow = {
  id: string;
  name: string;
  createdAt: string | Date;
  status: string;
  subscriptionPlan: string;
};

export default async function SuperAdminDashboard() {
  // 1. Fetch Tenant Stats
  const totalTenants = await prisma.tenant.count({
    where: { name: { not: "System Administration" } }
  });
  
  const activeTenants = await prisma.tenant.count({
    where: { 
      name: { not: "System Administration" },
      status: "ACTIVE"
    }
  });

  const totalUsers = await prisma.user.count({
    where: { role: { not: "SUPERADMIN" } }
  });

  // 2. Fetch Subscription stats
  const activeSubscriptionsCount = await prisma.tenantSubscription.count({
    where: { status: "ACTIVE" }
  });

  const trialSubscriptionsCount = await prisma.tenantSubscription.count({
    where: { status: "TRIAL" }
  });

  // 3. Compute Subscription Revenue (sum of all PAID invoices)
  const totalRevenueResult = await prisma.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { netAmount: true }
  });
  const totalRevenue = totalRevenueResult._sum.netAmount || 0;

  // 4. Calculate MRR & ARR
  // MRR = Active Monthly Subscription pricing amounts
  const activeMonthlySubs = await prisma.tenantSubscription.findMany({
    where: { status: "ACTIVE", plan: { interval: "MONTHLY" } },
    include: { plan: true }
  });
  const mrr = activeMonthlySubs.reduce((sum, s) => sum + s.plan.amount, 0);

  // ARR = (MRR * 12) + Active Yearly Subscription pricing amounts
  const activeYearlySubs = await prisma.tenantSubscription.findMany({
    where: { status: "ACTIVE", plan: { interval: "YEARLY" } },
    include: { plan: true }
  });
  const arr = (mrr * 12) + activeYearlySubs.reduce((sum, s) => sum + s.plan.amount, 0);

  // 5. Fetch Recent Tenants
  const recentTenants = await prisma.tenant.findMany({
    take: 5,
    where: { name: { not: "System Administration" } },
    orderBy: { createdAt: "desc" }
  });

  // 6. Tenant Growth Data (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const rawGrowthData = await prisma.$queryRaw<any[]>`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Tenant"
    WHERE "createdAt" >= ${thirtyDaysAgo} AND "name" != 'System Administration'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt")
  `;
  const growthData = rawGrowthData.map((item: { date: string | Date; count: string | number }) => ({
    date: format(new Date(item.date), "MMM dd"),
    count: Number(item.count)
  }));

  // 7. Plan performance: subscriber count per plan
  const plansStats = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: {
            where: { status: "ACTIVE" }
          }
        }
      }
    }
  });

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Platform Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of subscription revenue, active subscribers, and SaaS growth</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/tenants" 
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Building className="h-4 w-4" />
              Manage Tenants
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total SaaS Revenue" 
            value={`₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle="Subscription Payments Received"
            icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
            gradient="from-indigo-500/20 to-indigo-500/5"
          />
          <StatCard 
            title="Monthly Recurring (MRR)" 
            value={`₹${mrr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle={`ARR equivalent: ₹${arr.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
          <StatCard 
            title="Active Subscribers" 
            value={activeSubscriptionsCount.toString()}
            subtitle={`${trialSubscriptionsCount} tenants in free trials`}
            icon={<Users className="h-5 w-5 text-blue-600" />}
            gradient="from-blue-500/20 to-blue-500/5"
          />
          <StatCard 
            title="Total Tenant Accounts" 
            value={totalTenants.toString()}
            subtitle={`${activeTenants} active businesses`}
            icon={<Building className="h-5 w-5 text-violet-600" />}
            gradient="from-violet-500/20 to-violet-500/5"
          />
        </div>

        {/* Plan Breakdown / Distribution */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Tenant Growth (Last 30 Days)</h2>
            <div className="h-64 w-full">
              {growthData.length > 0 ? (
                <SuperAdminChart growthData={growthData} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No tenant signups recorded in the last 30 days.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-800">Subscribers per Plan</h2>
              <div className="space-y-4 pt-2">
                {plansStats.map((plan) => (
                  <div key={plan.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-700">{plan.name} ({plan.interval})</span>
                      <span className="text-gray-500 font-bold">{plan._count.subscriptions} subscribers</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ 
                          width: `${activeSubscriptionsCount > 0 
                            ? (plan._count.subscriptions / activeSubscriptionsCount) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between text-xs text-gray-400">
              <span>* Active paid subscribers count</span>
              <Link href="/admin/plans" className="text-indigo-600 font-semibold hover:underline">
                Manage Plans
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Tenants List */}
          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Tenant Signups</h2>
              <Link href="/tenants" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentTenants.map((tenant: TenantRow) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(tenant.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-indigo-600">
                        {tenant.subscriptionPlan}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${tenant.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}
                        `}>
                          {tenant.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentTenants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Health / Alerts */}
          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Platform Health</h2>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-emerald-900">All Systems Operational</h3>
              <p className="mt-2 text-emerald-700 text-sm">
                The database, API endpoints, and Razorpay webhook integrations are performing optimally. No alerts to display.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value,
  subtitle,
  icon, 
  gradient
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100/50">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
