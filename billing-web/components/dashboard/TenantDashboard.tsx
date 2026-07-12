import Link from 'next/link';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Plus,
  DollarSign,
  Wallet,
  Percent,
  Receipt,
  Users,
  UserPlus,
  Trophy,
  TrendingDown as TrendingDownIcon,
} from 'lucide-react';
import DashboardCharts from './DashboardCharts';
import RevenueChart from './RevenueChart';
import { CustomerGrowthChart, ComparisonBarChart } from './AdvancedCharts';
import {
  getSalesOverview,
  getPeriodTotals,
  getProfitOverview,
  getAverageBillValue,
  getBestWorstProducts,
  getCustomerGrowth,
  getSalesChartData,
  getCategoryChartData,
  getProfitTrendData,
  getCustomerGrowthChartData,
  getMonthlyComparison,
  getRecentTransactions,
  getLowStockItems,
  getOverviewCounts,
} from '@/lib/analytics';

export default async function TenantDashboard({
  searchParams,
  tenantId
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  tenantId: string;
}) {
  const timeRange = (searchParams?.timeRange as string) || "7d";
  let days = 7;
  if (timeRange === '30d') days = 30;
  else if (timeRange === '90d') days = 90;

  const session = await getServerSession(authOptions);
  const canViewProfit = session?.user?.role === 'SUPERADMIN' || (session?.user?.permissions || []).includes('VIEW_PROFIT');

  const [
    overview,
    periodTotals,
    avgBillValue,
    bestWorstProducts,
    customerGrowth,
    salesData,
    categoryData,
    customerGrowthChartData,
    monthlyComparison,
    recentTransactions,
    lowStockItems,
    overviewCounts,
    profitOverview,
    profitTrendData,
  ] = await Promise.all([
    getSalesOverview(tenantId),
    getPeriodTotals(tenantId),
    getAverageBillValue(tenantId),
    getBestWorstProducts(tenantId),
    getCustomerGrowth(tenantId),
    getSalesChartData(tenantId, days),
    getCategoryChartData(tenantId),
    getCustomerGrowthChartData(tenantId, days),
    getMonthlyComparison(tenantId),
    getRecentTransactions(tenantId),
    getLowStockItems(tenantId),
    getOverviewCounts(tenantId),
    canViewProfit ? getProfitOverview(tenantId) : Promise.resolve(null),
    canViewProfit ? getProfitTrendData(tenantId, days) : Promise.resolve([]),
  ]);

  const { totalSales, totalTransactions, todaySales, todayTransactions, todayTrend, revenueTrend, txTrend } = overview;
  const { weekSales, monthSales, yearSales } = periodTotals;
  const { totalProducts, lowStockProducts } = overviewCounts;
  const salesComparison = monthlyComparison.find(m => m.metric === 'Sales')!;
  const txComparison = monthlyComparison.find(m => m.metric === 'Transactions')!;

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Your store at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              Inventory
            </Link>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Bill
            </Link>
          </div>
        </header>

        {/* Stats Grid - 5 cards */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Revenue"
            value={`₹${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
            trend={revenueTrend !== null ? `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%` : undefined}
            trendUp={revenueTrend !== null ? revenueTrend >= 0 : undefined}
            trendLabel="vs prior 30 days"
            gradient="from-indigo-500/20 to-indigo-500/5"
          />
          <StatCard
            title="Today's Sales"
            value={`₹${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`${todayTransactions} bills today`}
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            trend={todayTrend !== null ? `${todayTrend >= 0 ? '+' : ''}${todayTrend.toFixed(1)}%` : undefined}
            trendUp={todayTrend !== null ? todayTrend >= 0 : undefined}
            trendLabel="vs yesterday"
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
          <StatCard
            title="Transactions"
            value={totalTransactions.toLocaleString()}
            icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
            trend={txTrend !== null ? `${txTrend >= 0 ? '+' : ''}${txTrend.toFixed(1)}%` : undefined}
            trendUp={txTrend !== null ? txTrend >= 0 : undefined}
            trendLabel="vs prior 30 days"
            gradient="from-blue-500/20 to-blue-500/5"
          />
          <StatCard
            title="Total Products"
            value={totalProducts.toLocaleString()}
            icon={<Package className="h-5 w-5 text-violet-600" />}
            gradient="from-violet-500/20 to-violet-500/5"
          />
          <StatCard
            title="Low Stock Alerts"
            value={lowStockProducts.toString()}
            icon={<AlertTriangle className={`h-5 w-5 ${lowStockProducts > 0 ? 'text-rose-600' : 'text-gray-400'}`} />}
            gradient={lowStockProducts > 0 ? "from-rose-500/20 to-rose-500/5" : "from-gray-500/20 to-gray-500/5"}
            alert={lowStockProducts > 0}
          />
        </div>

        {/* Period totals + profit + avg bill + customers */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Sales (7 / 30 / 365d)"
            value={`₹${weekSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtitle={`₹${monthSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} this month · ₹${yearSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} this year`}
            icon={<Receipt className="h-5 w-5 text-cyan-600" />}
            gradient="from-cyan-500/20 to-cyan-500/5"
          />
          {profitOverview && (
            <StatCard
              title="Profit (30d)"
              value={`₹${profitOverview.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              subtitle={`${profitOverview.grossMarginPercent.toFixed(1)}% gross margin`}
              icon={<Wallet className="h-5 w-5 text-emerald-600" />}
              gradient="from-emerald-500/20 to-emerald-500/5"
            />
          )}
          <StatCard
            title="Average Bill Value (30d)"
            value={`₹${avgBillValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            icon={<Percent className="h-5 w-5 text-amber-600" />}
            gradient="from-amber-500/20 to-amber-500/5"
          />
          <StatCard
            title="Customers This Month"
            value={customerGrowth.newCustomers.toString()}
            subtitle={`${customerGrowth.returningCustomers} returning`}
            icon={<UserPlus className="h-5 w-5 text-pink-600" />}
            gradient="from-pink-500/20 to-pink-500/5"
          />
        </div>

        {/* Charts */}
        <DashboardCharts salesData={salesData} categoryData={categoryData} />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {profitOverview && (
            <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-gray-800">Profit Trend</h2>
              <div className="h-64">
                {profitTrendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">No profit data yet</div>
                ) : (
                  <RevenueChart data={profitTrendData} label="Profit" color="#10B981" />
                )}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" />
              Customer Growth
            </h2>
            <div className="h-64">
              {customerGrowthChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">No new customers in this period</div>
              ) : (
                <CustomerGrowthChart data={customerGrowthChartData} />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Sales: This Month vs Last Month</h2>
            <div className="h-40">
              <ComparisonBarChart
                thisMonth={salesComparison.thisMonth}
                lastMonth={salesComparison.lastMonth}
                format="currency"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Transactions: This Month vs Last Month</h2>
            <div className="h-40">
              <ComparisonBarChart
                thisMonth={txComparison.thisMonth}
                lastMonth={txComparison.lastMonth}
                format="number"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Transactions */}
          <section className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
              <Link href="/transactions" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx: { id: string; createdAt: string | Date; user?: { name?: string } | null; netAmount: number; status: string }) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {format(new Date(tx.createdAt), 'MMM dd, h:mm a')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {tx.user?.name || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                          ₹{tx.netAmount.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                          `}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Link href={`/billing/${tx.id}`} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                            View Invoice
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Best/Worst Products + Low Stock */}
          <section className="flex flex-col gap-6">
            {/* Best Sellers */}
            <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
              <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Best Sellers
              </h2>
              <div className="space-y-4">
                {bestWorstProducts.best.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-8">
                    Not enough data to determine top products.
                  </div>
                ) : (
                  bestWorstProducts.best.map((product: { id: string; name: string; soldCount: number; revenue: number }, index: number) => (
                    <div key={product.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.soldCount} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{product.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Worst Sellers */}
            {bestWorstProducts.worst.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
                <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingDownIcon className="h-5 w-5 text-gray-400" />
                  Slow Movers
                </h2>
                <div className="space-y-2">
                  {bestWorstProducts.worst.map((product: { id: string; name: string; soldCount: number; revenue: number }) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 p-3">
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[140px]">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.soldCount} sold</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Products Widget */}
            {lowStockItems.length > 0 && (
              <div className="rounded-2xl border border-rose-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Alert
                  </h2>
                  <Link href="/products?lowStock=true" className="text-xs font-medium text-rose-600 hover:text-rose-700">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {lowStockItems.map((item: { id: string; name: string; stock: number; minStockThreshold: number | null; unit: string }) => (
                    <Link
                      key={item.id}
                      href={`/products/${item.id}`}
                      className="flex items-center justify-between rounded-lg bg-white border border-rose-100 p-3 hover:border-rose-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Threshold: {item.minStockThreshold ?? 10} {item.unit}
                        </p>
                      </div>
                      <div className={`text-right font-bold text-sm ${
                        item.stock === 0 ? 'text-red-600' : item.stock <= 5 ? 'text-orange-600' : 'text-amber-600'
                      }`}>
                        {item.stock} {item.unit}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
  trend,
  trendUp,
  trendLabel,
  gradient,
  alert
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  trendLabel?: string;
  gradient: string;
  alert?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${alert ? 'border-rose-200' : 'border-gray-100'} bg-white p-6 shadow-xl shadow-gray-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50`}>
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
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend}
            </span>
          )}
        </div>
        {(subtitle || trendLabel) && (
          <p className="mt-1 text-xs text-gray-400">
            {subtitle || trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
