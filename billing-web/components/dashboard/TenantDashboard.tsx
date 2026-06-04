import Link from 'next/link';
import prisma from '@/lib/prisma';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Plus,
  Receipt,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';
import DashboardCharts from './DashboardCharts';

export default async function TenantDashboard({
  searchParams,
  tenantId
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  tenantId: string;
}) {
  const timeRange = (searchParams?.timeRange as string) || "7d";

  // 1. Fetch Overall Stats
  const totalSalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId }
  });
  const totalSales = totalSalesResult._sum.netAmount || 0;
  const totalTransactions = await prisma.transaction.count({
    where: { tenantId }
  });
  const totalProducts = await prisma.product.count({
    where: { tenantId }
  });
  const lowStockProducts = await prisma.product.count({
    where: {
      stock: { lte: 10 },
      tenantId
    }
  });

  // 2. Today's Sales
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todaySalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: {
      tenantId,
      createdAt: { gte: todayStart, lte: todayEnd }
    }
  });
  const todaySales = todaySalesResult._sum.netAmount || 0;
  const todayTransactions = await prisma.transaction.count({
    where: {
      tenantId,
      createdAt: { gte: todayStart, lte: todayEnd }
    }
  });

  // 3. Fetch Sales Data for Charts
  let days = 7;
  if (timeRange === '30d') days = 30;
  else if (timeRange === '90d') days = 90;

  const startDate = subDays(new Date(), days);

  const rawSalesData = await prisma.$queryRaw<any[]>`
    SELECT
      DATE("createdAt") as date,
      SUM("netAmount") as total
    FROM "Transaction"
    WHERE "createdAt" >= ${startDate} AND "tenantId" = ${tenantId}
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt")
  `;
  const salesData = rawSalesData.map((item: { date: string | Date; total: string | number }) => ({
    date: format(new Date(item.date), 'MM/dd'),
    total: Number(item.total)
  }));

  // 4. Fetch Category Data
  const rawCategoryData = await prisma.$queryRaw<any[]>`
    SELECT
      p."category",
      SUM(ti."itemTotal") as total
    FROM "TransactionItem" ti
    JOIN "Product" p ON ti."productId" = p."id"
    JOIN "Transaction" t ON ti."transactionId" = t."id"
    WHERE p."category" IS NOT NULL AND t."tenantId" = ${tenantId}
    GROUP BY p."category"
    ORDER BY total DESC
    LIMIT 5
  `;
  const categoryData = rawCategoryData.map((item: { category?: string; total: string | number }) => ({
    name: item.category || 'Uncategorized',
    value: Number(item.total)
  }));

  // 5. Fetch Recent Transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    where: { tenantId },
    include: { user: true }
  });

  // 6. Fetch Top Products
  const topProductsRaw = await prisma.$queryRaw<any[]>`
    SELECT
      p."id", p."name", p."stock", p."salePrice",
      SUM(ti."quantity") as soldCount,
      SUM(ti."itemTotal") as revenue
    FROM "TransactionItem" ti
    JOIN "Product" p ON ti."productId" = p."id"
    JOIN "Transaction" t ON ti."transactionId" = t."id"
    WHERE t."tenantId" = ${tenantId}
    GROUP BY p."id", p."name", p."stock", p."salePrice"
    ORDER BY soldCount DESC
    LIMIT 5
  `;
  const topProducts = topProductsRaw.map((p: any) => ({
    ...p,
    soldCount: Number(p.soldcount ?? p.soldCount ?? 0),
    revenue: Number(p.revenue ?? p.revenue)
  }));

  // 7. Fetch Low Stock Products
  const lowStockItems: Array<{ id: string; name: string; stock: number; minStockThreshold: number | null; unit: string }> =
    await prisma.product.findMany({
      where: {
        stock: { lte: 10 },
        tenantId
      },
      orderBy: { stock: 'asc' },
      take: 5,
      select: { id: true, name: true, stock: true, minStockThreshold: true, unit: true }
    });

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
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Revenue"
            value={`₹${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
            trend="+12.5%"
            trendUp={true}
            gradient="from-indigo-500/20 to-indigo-500/5"
          />
          <StatCard
            title="Today's Sales"
            value={`₹${todaySales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            subtitle={`${todayTransactions} bills today`}
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
          <StatCard
            title="Transactions"
            value={totalTransactions.toLocaleString()}
            icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
            trend="+5.2%"
            trendUp={true}
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

        {/* Charts */}
        <DashboardCharts salesData={salesData} categoryData={categoryData} />

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

          {/* Right Column: Top Products + Low Stock */}
          <section className="flex flex-col gap-6">
            {/* Top Products */}
            <div className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
              <h2 className="mb-6 text-xl font-bold text-gray-800">Top Products</h2>
              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-8">
                    Not enough data to determine top products.
                  </div>
                ) : (
                  topProducts.map((product: { id: string; name: string; soldCount: number; revenue: number }, index: number) => (
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
  gradient,
  alert
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
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
            <span className={`text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
