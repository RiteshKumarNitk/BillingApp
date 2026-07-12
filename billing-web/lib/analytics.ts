import prisma from "@/lib/prisma";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

// HELD bills are drafts, not completed sales — every query in this file excludes them so
// dashboard numbers only ever reflect real, finished transactions.
const NOT_HELD = { not: "HELD" } as const;

export async function getSalesOverview(tenantId: string) {
  const totalSalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD },
  });
  const totalSales = totalSalesResult._sum.netAmount || 0;
  const totalTransactions = await prisma.transaction.count({
    where: { tenantId, status: NOT_HELD },
  });

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todaySalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: todayStart, lte: todayEnd } },
  });
  const todaySales = todaySalesResult._sum.netAmount || 0;
  const todayTransactions = await prisma.transaction.count({
    where: { tenantId, status: NOT_HELD, createdAt: { gte: todayStart, lte: todayEnd } },
  });

  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));
  const yesterdaySalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
  });
  const yesterdaySales = yesterdaySalesResult._sum.netAmount || 0;
  const todayTrend = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : null;

  const last30Start = subDays(new Date(), 30);
  const prior30Start = subDays(new Date(), 60);
  const [last30SalesResult, prior30SalesResult, last30TxCount, prior30TxCount] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: last30Start } } }),
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: prior30Start, lt: last30Start } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: last30Start } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: prior30Start, lt: last30Start } } }),
  ]);
  const last30Sales = last30SalesResult._sum.netAmount || 0;
  const prior30Sales = prior30SalesResult._sum.netAmount || 0;
  const revenueTrend = prior30Sales > 0 ? ((last30Sales - prior30Sales) / prior30Sales) * 100 : null;
  const txTrend = prior30TxCount > 0 ? ((last30TxCount - prior30TxCount) / prior30TxCount) * 100 : null;

  return {
    totalSales, totalTransactions,
    todaySales, todayTransactions, todayTrend,
    revenueTrend, txTrend,
  };
}

export async function getPeriodTotals(tenantId: string) {
  const now = new Date();
  const weekStart = subDays(now, 7);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [weekResult, monthResult, yearResult] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: weekStart } } }),
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: monthStart } } }),
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: yearStart } } }),
  ]);

  return {
    weekSales: weekResult._sum.netAmount || 0,
    monthSales: monthResult._sum.netAmount || 0,
    yearSales: yearResult._sum.netAmount || 0,
  };
}

// Profit = what was actually charged (netAmount) minus cost of goods sold (purchasePrice * qty).
// Windowed to the last 30 days to match the existing revenue-trend window elsewhere on this
// dashboard. Callers must check the VIEW_PROFIT permission before calling this — it isn't
// re-checked here since this is a data-layer function, not a route handler.
export async function getProfitOverview(tenantId: string) {
  const last30Start = subDays(new Date(), 30);

  const revenueResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: last30Start } },
  });
  const revenue = revenueResult._sum.netAmount || 0;

  const costRaw = await prisma.$queryRaw<{ cost: string | number | null }[]>`
    SELECT SUM(ti."purchasePrice" * ti."quantity") as cost
    FROM "TransactionItem" ti
    JOIN "Transaction" t ON ti."transactionId" = t."id"
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${last30Start}
  `;
  const cost = Number(costRaw[0]?.cost || 0);

  const totalProfit = revenue - cost;
  const grossMarginPercent = revenue > 0 ? (totalProfit / revenue) * 100 : 0;

  return { totalProfit, grossMarginPercent, revenue, cost };
}

export async function getAverageBillValue(tenantId: string) {
  const last30Start = subDays(new Date(), 30);
  const result = await prisma.transaction.aggregate({
    _avg: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: last30Start } },
  });
  return result._avg.netAmount || 0;
}

export async function getBestWorstProducts(tenantId: string) {
  const [bestRaw, worstRaw] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT p."id", p."name", p."stock", p."salePrice",
        SUM(ti."quantity") as soldCount, SUM(ti."itemTotal") as revenue
      FROM "TransactionItem" ti
      JOIN "Product" p ON ti."productId" = p."id"
      JOIN "Transaction" t ON ti."transactionId" = t."id"
      WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD'
      GROUP BY p."id", p."name", p."stock", p."salePrice"
      ORDER BY soldCount DESC
      LIMIT 5
    `,
    prisma.$queryRaw<any[]>`
      SELECT p."id", p."name", p."stock", p."salePrice",
        SUM(ti."quantity") as soldCount, SUM(ti."itemTotal") as revenue
      FROM "TransactionItem" ti
      JOIN "Product" p ON ti."productId" = p."id"
      JOIN "Transaction" t ON ti."transactionId" = t."id"
      WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD'
      GROUP BY p."id", p."name", p."stock", p."salePrice"
      ORDER BY soldCount ASC
      LIMIT 5
    `,
  ]);

  const normalize = (rows: any[]) => rows.map((p) => ({
    ...p,
    soldCount: Number(p.soldcount ?? 0),
    revenue: Number(p.revenue ?? 0),
  }));

  return { best: normalize(bestRaw), worst: normalize(worstRaw) };
}

// New = signed up within the window. Returning = existed before the window and purchased
// again during it. Walk-in sales without a linked Customer record aren't counted either way.
export async function getCustomerGrowth(tenantId: string) {
  const monthStart = startOfMonth(new Date());

  const newCustomers = await prisma.customer.count({
    where: { tenantId, createdDate: { gte: monthStart } },
  });

  const returningRaw = await prisma.$queryRaw<{ count: string | number }[]>`
    SELECT COUNT(DISTINCT t."customerId") as count
    FROM "Transaction" t
    JOIN "Customer" c ON t."customerId" = c."id"
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD'
      AND t."createdAt" >= ${monthStart} AND c."createdDate" < ${monthStart}
  `;
  const returningCustomers = Number(returningRaw[0]?.count || 0);

  return { newCustomers, returningCustomers };
}

export async function getSalesChartData(tenantId: string, days: number) {
  const startDate = subDays(new Date(), days);
  const rawSalesData = await prisma.$queryRaw<any[]>`
    SELECT DATE("createdAt") as date, SUM("netAmount") as total
    FROM "Transaction"
    WHERE "createdAt" >= ${startDate} AND "tenantId" = ${tenantId} AND "status" != 'HELD'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt")
  `;
  return rawSalesData.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    total: Number(item.total),
  }));
}

export async function getCategoryChartData(tenantId: string) {
  const rawCategoryData = await prisma.$queryRaw<any[]>`
    SELECT p."category", SUM(ti."itemTotal") as total
    FROM "TransactionItem" ti
    JOIN "Product" p ON ti."productId" = p."id"
    JOIN "Transaction" t ON ti."transactionId" = t."id"
    WHERE p."category" IS NOT NULL AND t."tenantId" = ${tenantId} AND t."status" != 'HELD'
    GROUP BY p."category"
    ORDER BY total DESC
    LIMIT 5
  `;
  return rawCategoryData.map((item) => ({
    name: item.category || "Uncategorized",
    value: Number(item.total),
  }));
}

// Daily profit for the last N days, shaped for the reused RevenueChart line-chart component.
// Cost is pre-aggregated per-transaction in a subquery before joining, so a transaction with
// multiple line items doesn't cause its netAmount to be summed once per item.
export async function getProfitTrendData(tenantId: string, days: number) {
  const startDate = subDays(new Date(), days);
  const rawProfitData = await prisma.$queryRaw<any[]>`
    SELECT DATE(t."createdAt") as date,
      SUM(t."netAmount") as revenueSum,
      SUM(cost_per_tx.cost) as cost
    FROM "Transaction" t
    JOIN (
      SELECT "transactionId", SUM("purchasePrice" * "quantity") as cost
      FROM "TransactionItem"
      GROUP BY "transactionId"
    ) cost_per_tx ON cost_per_tx."transactionId" = t."id"
    WHERE t."createdAt" >= ${startDate} AND t."tenantId" = ${tenantId} AND t."status" != 'HELD'
    GROUP BY DATE(t."createdAt")
    ORDER BY DATE(t."createdAt")
  `;
  return rawProfitData.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    revenue: Number(item.revenuesum || 0) - Number(item.cost || 0),
  }));
}

export async function getCustomerGrowthChartData(tenantId: string, days: number) {
  const startDate = subDays(new Date(), days);
  const rawData = await prisma.$queryRaw<any[]>`
    SELECT DATE("createdDate") as date, COUNT(*) as count
    FROM "Customer"
    WHERE "createdDate" >= ${startDate} AND "tenantId" = ${tenantId}
    GROUP BY DATE("createdDate")
    ORDER BY DATE("createdDate")
  `;
  return rawData.map((item) => ({
    date: format(new Date(item.date), "MM/dd"),
    count: Number(item.count),
  }));
}

export async function getMonthlyComparison(tenantId: string) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisMonth, lastMonth, thisMonthTx, lastMonthTx] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } } }),
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
  ]);

  return [
    { metric: "Sales", thisMonth: thisMonth._sum.netAmount || 0, lastMonth: lastMonth._sum.netAmount || 0 },
    { metric: "Transactions", thisMonth: thisMonthTx, lastMonth: lastMonthTx },
  ];
}

export async function getRecentTransactions(tenantId: string, take = 5) {
  return prisma.transaction.findMany({
    take,
    orderBy: { createdAt: "desc" },
    where: { tenantId, status: NOT_HELD },
    include: { user: true },
  });
}

export async function getLowStockItems(tenantId: string, take = 5) {
  return prisma.product.findMany({
    where: { stock: { lte: 10 }, tenantId },
    orderBy: { stock: "asc" },
    take,
    select: { id: true, name: true, stock: true, minStockThreshold: true, unit: true },
  });
}

export async function getOverviewCounts(tenantId: string) {
  const [totalProducts, lowStockProducts] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.product.count({ where: { stock: { lte: 10 }, tenantId } }),
  ]);
  return { totalProducts, lowStockProducts };
}
