import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import {
  getGstSummary,
  getGstTrendData,
  getPeakHoursData,
  getPaymentSummary,
  getCategoryChartData,
  getCustomerGrowth,
  getCustomerGrowthChartData,
  getTopCustomers,
} from "@/lib/analytics";
import { Clock, Wallet, Receipt, Tag, Users } from "lucide-react";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { CustomerGrowthChart } from "@/components/dashboard/AdvancedCharts";
import { PeakHoursChart, PaymentMethodChart, FullCategoryChart } from "@/components/reports/ReportsCharts";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }
  if (session.user.role === "SUPERADMIN") {
    redirect("/dashboard");
  }

  const authorized = await hasPermission("VIEW_REPORTS");
  if (!authorized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to view reports.</p>
        </div>
      </div>
    );
  }

  const tenantId = session.user.tenantId as string;

  const [
    gstSummary,
    gstTrendData,
    peakHours,
    paymentSummary,
    categoryData,
    customerGrowth,
    customerGrowthChartData,
    topCustomers,
  ] = await Promise.all([
    getGstSummary(tenantId),
    getGstTrendData(tenantId, 30),
    getPeakHoursData(tenantId),
    getPaymentSummary(tenantId),
    getCategoryChartData(tenantId, 10),
    getCustomerGrowth(tenantId),
    getCustomerGrowthChartData(tenantId, 30),
    getTopCustomers(tenantId, 10),
  ]);

  const busiestHour = peakHours.reduce((max, h) => (h.total > max.total ? h : max), peakHours[0]);
  const totalPayments = paymentSummary.reduce((sum, p) => sum + p.total, 0);
  const totalCategoryRevenue = categoryData.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Peak hours, payments, GST, categories and customers</p>
        </header>

        {/* GST Summary stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="GST This Week" value={`₹${gstSummary.weekTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<Receipt className="h-5 w-5 text-indigo-600" />} gradient="from-indigo-500/20 to-indigo-500/5" />
          <StatCard title="GST This Month" value={`₹${gstSummary.monthTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<Receipt className="h-5 w-5 text-emerald-600" />} gradient="from-emerald-500/20 to-emerald-500/5" />
          <StatCard title="GST This Year" value={`₹${gstSummary.yearTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<Receipt className="h-5 w-5 text-amber-600" />} gradient="from-amber-500/20 to-amber-500/5" />
          <StatCard
            title="Taxable Bills"
            value={gstSummary.totalCount > 0 ? `${Math.round((gstSummary.taxableCount / gstSummary.totalCount) * 100)}%` : "0%"}
            subtitle={`${gstSummary.taxableCount} of ${gstSummary.totalCount} bills`}
            icon={<Wallet className="h-5 w-5 text-violet-600" />}
            gradient="from-violet-500/20 to-violet-500/5"
          />
        </div>

        {/* GST Trend */}
        <section className="mb-8 rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-bold text-gray-800">GST Collected — Last 30 Days</h2>
          <div className="h-64">
            {gstTrendData.every((d) => d.revenue === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No GST collected in this period</div>
            ) : (
              <RevenueChart data={gstTrendData} label="GST" color="#6366F1" />
            )}
          </div>
        </section>

        {/* Peak Hours + Payment Summary */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" /> Peak Hours — Last 30 Days
              </h2>
              {busiestHour && busiestHour.total > 0 && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
                  Busiest: {busiestHour.label}
                </span>
              )}
            </div>
            <div className="h-72">
              {peakHours.every((h) => h.total === 0) ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No sales data available</div>
              ) : (
                <PeakHoursChart data={peakHours} />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" /> Payment Summary — Last 30 Days
            </h2>
            <div className="h-72">
              {paymentSummary.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No payments recorded</div>
              ) : (
                <PaymentMethodChart data={paymentSummary} />
              )}
            </div>
            {paymentSummary.length > 0 && (
              <div className="mt-4 space-y-2">
                {paymentSummary.map((p) => (
                  <div key={p.method} className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="font-medium text-gray-700">{p.method}</span>
                    <span className="text-gray-500">{p.count} bills</span>
                    <span className="font-bold text-gray-900">₹{p.total.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">{totalPayments > 0 ? `${((p.total / totalPayments) * 100).toFixed(0)}%` : "0%"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Top Categories (promoted from dashboard widget) */}
        <section className="mb-8 rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-500" /> Top Categories
          </h2>
          <div className="h-80">
            {categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No category data available</div>
            ) : (
              <FullCategoryChart data={categoryData} />
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700 truncate">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {totalCategoryRevenue > 0 ? `${((c.value / totalCategoryRevenue) * 100).toFixed(0)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Customer Analytics (promoted from dashboard widget) */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" /> New Customers — Last 30 Days
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {customerGrowth.newCustomers} new · {customerGrowth.returningCustomers} returning this month
            </p>
            <div className="h-64">
              {customerGrowthChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No new customers in this period</div>
              ) : (
                <CustomerGrowthChart data={customerGrowthChartData} />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Top Customers by Spend</h2>
            {topCustomers.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">No customer purchases yet</div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, index) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone} · {c.orders} orders</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">₹{c.spend.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
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
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100/50">{icon}</div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
        </div>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}
