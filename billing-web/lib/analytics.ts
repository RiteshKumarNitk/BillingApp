import prisma from "@/lib/prisma";
import { Prisma } from "../generated/prisma";
import { format, subDays } from "date-fns";
import {
  getTenantTimeZone, startOfDayInTz, startOfMonthInTz, startOfYearInTz, formatDateKey,
} from "@/lib/tenantTime";

// HELD bills are drafts, not completed sales — every query in this file excludes them so
// dashboard numbers only ever reflect real, finished transactions.
const NOT_HELD = { not: "HELD" } as const;

// M8: calendar boundaries ("today", "this month") and SQL day/hour buckets all use the tenant's
// timezone (lib/tenantTime.ts), not the server clock. Rolling windows ("last 30 days") are plain
// instants and need no timezone. `createdAt` is a UTC TIMESTAMP, so the SQL local-time expression
// is `("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE <tz>`; GROUP/ORDER BY use positions because a
// re-bound tz parameter wouldn't count as "the same expression" for Postgres.

export async function getSalesOverview(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const totalSalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD },
  });
  const totalSales = totalSalesResult._sum.netAmount || 0;
  const totalTransactions = await prisma.transaction.count({
    where: { tenantId, status: NOT_HELD },
  });

  const now = new Date();
  const todayStart = startOfDayInTz(now, tz);
  const tomorrowStart = startOfDayInTz(now, tz, 1);
  const todaySalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: todayStart, lt: tomorrowStart } },
  });
  const todaySales = todaySalesResult._sum.netAmount || 0;
  const todayTransactions = await prisma.transaction.count({
    where: { tenantId, status: NOT_HELD, createdAt: { gte: todayStart, lt: tomorrowStart } },
  });

  const yesterdayStart = startOfDayInTz(now, tz, -1);
  const yesterdaySalesResult = await prisma.transaction.aggregate({
    _sum: { netAmount: true },
    where: { tenantId, status: NOT_HELD, createdAt: { gte: yesterdayStart, lt: todayStart } },
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

// B3: week is a rolling last-7-days window; month/year are calendar periods in the tenant's
// timezone ("this month" / "this year") — the dashboard labels say exactly that.
export async function getPeriodTotals(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const now = new Date();
  const weekStart = subDays(now, 7);
  const monthStart = startOfMonthInTz(now, tz);
  const yearStart = startOfYearInTz(now, tz);

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

// Product-mix widgets look at a recent window, not all-time history: an all-time aggregate grows
// with every sale ever made (measured 215–510 ms at 100k sales for one tenant, linear beyond), and
// "best seller"/"slow mover" is only actionable for recent trading anyway. Labels say "90 days".
export const PRODUCT_MIX_WINDOW_DAYS = 90;

// `FROM ... WHERE ...` fragment yielding one row `l` per line item of this tenant's non-held sales
// since `since`. Written so the plan is driven by the tenant's (tenantId, createdAt) index and
// fetches lines per sale through the transactionId index. A plain JOIN let the planner start from
// the *platform-wide* TransactionItem table instead (measured: 250k-row seq scan + 250k primary-key
// probes, 1.0M buffers, 576 ms for one tenant's chart) — cost that grows with every other tenant's
// data. `OFFSET 0` is the standard fence that stops Postgres flattening the LATERAL back into that
// join (verified: without it the plan was unchanged). Result: ~105k buffers, ~110 ms, and
// proportional to this tenant's window only.
function windowedLinesSql(tenantId: string, since: Date) {
  return Prisma.sql`
    FROM "Transaction" t
    CROSS JOIN LATERAL (
      SELECT ti."productId", ti."quantity", ti."itemTotal"
      FROM "TransactionItem" ti
      WHERE ti."transactionId" = t."id"
      OFFSET 0
    ) l
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${since}
  `;
}

export async function getBestWorstProducts(tenantId: string) {
  const since = subDays(new Date(), PRODUCT_MIX_WINDOW_DAYS);
  // One aggregation (at most one row per product sold in the window), then both ends of it —
  // previously the same full aggregation ran twice, once per sort direction.
  // Tenant-window-driven plan (see windowedLinesSql): aggregate per product first (≤ one row per
  // product), then join Product once.
  const ranked = await prisma.$queryRaw<any[]>`
    WITH per_product AS (
      SELECT l."productId", SUM(l."quantity") AS sold, SUM(l."itemTotal") AS revenue
      ${windowedLinesSql(tenantId, since)}
      GROUP BY l."productId"
    )
    SELECT p."id", p."name", p."stock", p."salePrice", pp.sold as soldCount, pp.revenue as revenue
    FROM per_product pp
    JOIN "Product" p ON p."id" = pp."productId"
    ORDER BY pp.sold DESC, p."id"
  `;
  const bestRaw = ranked.slice(0, 5);
  const worstRaw = ranked.slice(-5).reverse();

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
  const monthStart = startOfMonthInTz(new Date(), await getTenantTimeZone(tenantId));

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

// `endDate` is optional (defaults to now) so existing callers that only pass `days` are unaffected —
// lets the Reports page's dashboard-linked date-range filter reuse this instead of a parallel query.
export async function getSalesChartData(tenantId: string, days: number, endDate?: Date) {
  const tz = await getTenantTimeZone(tenantId);
  const end = endDate ?? new Date();
  const startDate = subDays(end, days);
  const rawSalesData = await prisma.$queryRaw<any[]>`
    SELECT DATE(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) as date, SUM("netAmount") as total
    FROM "Transaction"
    WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${end} AND "tenantId" = ${tenantId} AND "status" != 'HELD'
    GROUP BY 1
    ORDER BY 1
  `;
  return rawSalesData.map((item) => ({
    date: formatDateKey(item.date),
    total: Number(item.total),
  }));
}

// Same recent window as getBestWorstProducts (see PRODUCT_MIX_WINDOW_DAYS).
export async function getCategoryChartData(tenantId: string, limit = 5) {
  const since = subDays(new Date(), PRODUCT_MIX_WINDOW_DAYS);
  const rawCategoryData = await prisma.$queryRaw<any[]>`
    WITH per_product AS (
      SELECT l."productId", SUM(l."itemTotal") AS total
      ${windowedLinesSql(tenantId, since)}
      GROUP BY l."productId"
    )
    SELECT p."category", SUM(pp.total) as total
    FROM per_product pp
    JOIN "Product" p ON p."id" = pp."productId"
    WHERE p."category" IS NOT NULL
    GROUP BY p."category"
    ORDER BY total DESC
    LIMIT ${limit}
  `;
  return rawCategoryData.map((item) => ({
    name: item.category || "Uncategorized",
    value: Number(item.total),
  }));
}

// Daily profit for the last N days, shaped for the reused RevenueChart line-chart component.
// Cost is pre-aggregated per-transaction before joining, so a transaction with multiple line
// items doesn't cause its netAmount to be summed once per item. P2: the cost aggregation used to
// scan and group the ENTIRE TransactionItem table (every tenant, all time) before the outer
// filter applied; it now only touches the items of this tenant's in-window transactions.
export async function getProfitTrendData(tenantId: string, days: number, endDate?: Date) {
  const tz = await getTenantTimeZone(tenantId);
  const end = endDate ?? new Date();
  const startDate = subDays(end, days);
  // Cost per sale via an aggregating LATERAL: Postgres can't flatten an aggregate subquery, so this
  // stays "this tenant's in-window sales → their lines by index" instead of hashing every line
  // item on the platform (measured 73 → 46 ms at 100k sales; independent of other tenants' data).
  // `cost IS NOT NULL` keeps the old inner-join semantics (sales with no lines are skipped).
  const rawProfitData = await prisma.$queryRaw<any[]>`
    SELECT DATE((t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS date,
      SUM(t."netAmount") as revenueSum,
      SUM(c.cost) as cost
    FROM "Transaction" t
    CROSS JOIN LATERAL (
      SELECT SUM(ti."purchasePrice" * ti."quantity") AS cost
      FROM "TransactionItem" ti
      WHERE ti."transactionId" = t."id"
    ) c
    WHERE t."createdAt" >= ${startDate} AND t."createdAt" <= ${end} AND t."tenantId" = ${tenantId} AND t."status" != 'HELD'
      AND c.cost IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  `;
  return rawProfitData.map((item) => ({
    date: formatDateKey(item.date),
    revenue: Number(item.revenuesum || 0) - Number(item.cost || 0),
  }));
}

export async function getCustomerGrowthChartData(tenantId: string, days: number, endDate?: Date) {
  const tz = await getTenantTimeZone(tenantId);
  const end = endDate ?? new Date();
  const startDate = subDays(end, days);
  const rawData = await prisma.$queryRaw<any[]>`
    SELECT DATE(("createdDate" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) as date, COUNT(*) as count
    FROM "Customer"
    WHERE "createdDate" >= ${startDate} AND "createdDate" <= ${end} AND "tenantId" = ${tenantId}
    GROUP BY 1
    ORDER BY 1
  `;
  return rawData.map((item) => ({
    date: formatDateKey(item.date),
    count: Number(item.count),
  }));
}

export async function getMonthlyComparison(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const now = new Date();
  const thisMonthStart = startOfMonthInTz(now, tz);
  const nextMonthStart = startOfMonthInTz(now, tz, 1);
  const lastMonthStart = startOfMonthInTz(now, tz, -1);

  const [thisMonth, lastMonth, thisMonthTx, lastMonthTx] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: thisMonthStart, lt: nextMonthStart } } }),
    prisma.transaction.aggregate({ _sum: { netAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: thisMonthStart, lt: nextMonthStart } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
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
    // At or below each product's own reorder threshold (minStockThreshold, default 10).
    where: { stock: { lte: prisma.product.fields.minStockThreshold }, tenantId },
    orderBy: { stock: "asc" },
    take,
    select: { id: true, name: true, stock: true, minStockThreshold: true, unit: true },
  });
}

export async function getOverviewCounts(tenantId: string) {
  const [totalProducts, lowStockProducts] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.product.count({ where: { stock: { lte: prisma.product.fields.minStockThreshold }, tenantId } }),
  ]);
  return { totalProducts, lowStockProducts };
}

// Revenue + order count by hour-of-day (0-23), last 30 days. Every hour is present in the
// result (zero-filled) so the chart's x-axis doesn't skip hours with no sales.
export async function getPeakHoursData(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const startDate = subDays(new Date(), 30);
  // Local hour-of-day — previously the UTC hour, which put an Indian cafe's lunch rush at 6-8am.
  const raw = await prisma.$queryRaw<any[]>`
    SELECT EXTRACT(HOUR FROM (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})) as hour, SUM("netAmount") as total, COUNT(*) as count
    FROM "Transaction"
    WHERE "tenantId" = ${tenantId} AND "status" != 'HELD' AND "createdAt" >= ${startDate}
    GROUP BY 1
  `;
  const byHour = new Map(raw.map((r) => [Number(r.hour), { total: Number(r.total), count: Number(r.count) }]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: format(new Date(2000, 0, 1, hour), "ha"),
    total: byHour.get(hour)?.total || 0,
    count: byHour.get(hour)?.count || 0,
  }));
}

export async function getPaymentSummary(tenantId: string) {
  const startDate = subDays(new Date(), 30);
  // Same tenant-window-driven shape as windowedLinesSql (OFFSET 0 fence), so this never scans the
  // platform-wide payments table.
  const raw = await prisma.$queryRaw<any[]>`
    SELECT tp."method", SUM(tp."amount") as total, COUNT(*) as count
    FROM "Transaction" t
    CROSS JOIN LATERAL (
      SELECT p."method", p."amount" FROM "TransactionPayment" p WHERE p."transactionId" = t."id" OFFSET 0
    ) tp
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${startDate}
    GROUP BY tp."method"
    ORDER BY total DESC
  `;
  return raw.map((r) => ({ method: r.method, total: Number(r.total), count: Number(r.count) }));
}

// GST/tax collected — mirrors getPeriodTotals' window pattern (rolling 7 days, calendar month and
// year in the tenant's timezone) but for taxAmount.
export async function getGstSummary(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const now = new Date();
  const weekStart = subDays(now, 7);
  const monthStart = startOfMonthInTz(now, tz);
  const yearStart = startOfYearInTz(now, tz);

  const [weekResult, monthResult, yearResult, taxableCount, totalCount] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { taxAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: weekStart } } }),
    prisma.transaction.aggregate({ _sum: { taxAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: monthStart } } }),
    prisma.transaction.aggregate({ _sum: { taxAmount: true }, where: { tenantId, status: NOT_HELD, createdAt: { gte: yearStart } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD, taxAmount: { gt: 0 } } }),
    prisma.transaction.count({ where: { tenantId, status: NOT_HELD } }),
  ]);

  return {
    weekTax: weekResult._sum.taxAmount || 0,
    monthTax: monthResult._sum.taxAmount || 0,
    yearTax: yearResult._sum.taxAmount || 0,
    taxableCount,
    totalCount,
  };
}

// Shaped to match RevenueChart's expected {date, revenue} points so the GST trend can reuse
// the same line-chart component as the dashboard's Profit Trend.
export async function getGstTrendData(tenantId: string, days: number) {
  const tz = await getTenantTimeZone(tenantId);
  const startDate = subDays(new Date(), days);
  const raw = await prisma.$queryRaw<any[]>`
    SELECT DATE(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) as date, SUM("taxAmount") as tax
    FROM "Transaction"
    WHERE "createdAt" >= ${startDate} AND "tenantId" = ${tenantId} AND "status" != 'HELD'
    GROUP BY 1
    ORDER BY 1
  `;
  return raw.map((item) => ({
    date: formatDateKey(item.date),
    revenue: Number(item.tax),
  }));
}

// `since` is optional (defaults to all-time, the existing behavior) so the Reports page's
// existing all-time call is unaffected — getCustomerOfTheMonth below is the first caller to pass
// an explicit window.
export async function getTopCustomers(tenantId: string, take = 10, since?: Date) {
  const raw = await prisma.$queryRaw<any[]>`
    SELECT c."id", c."name", c."phone", COUNT(t."id") as orders, SUM(t."netAmount") as spend
    FROM "Transaction" t
    JOIN "Customer" c ON t."customerId" = c."id"
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD'
      ${since ? Prisma.sql`AND t."createdAt" >= ${since}` : Prisma.empty}
    GROUP BY c."id", c."name", c."phone"
    ORDER BY spend DESC
    LIMIT ${take}
  `;
  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    orders: Number(r.orders),
    spend: Number(r.spend),
  }));
}

// "Customer of the Month" — scores this calendar month's customers on a weighted blend of the 4
// signals product asked for (spend weighted highest as the clearest business-impact signal, then
// order count and visit frequency for loyalty, then average order value). Not ML, just a
// normalized-weighted-sum over real data — no fabricated rating/review signal involved.
export async function getCustomerOfTheMonth(tenantId: string) {
  const tz = await getTenantTimeZone(tenantId);
  const monthStart = startOfMonthInTz(new Date(), tz);

  const raw = await prisma.$queryRaw<any[]>`
    SELECT c."id", c."name", c."phone", c."photoUrl",
      COUNT(t."id") as orders,
      SUM(t."netAmount") as spend,
      COUNT(DISTINCT DATE((t."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})) as visits
    FROM "Transaction" t
    JOIN "Customer" c ON t."customerId" = c."id"
    WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${monthStart}
    GROUP BY c."id", c."name", c."phone", c."photoUrl"
  `;
  if (raw.length === 0) return null;

  const candidates = raw.map((r) => {
    const orders = Number(r.orders);
    const spend = Number(r.spend);
    return {
      id: r.id as string,
      name: r.name as string,
      phone: r.phone as string | null,
      photoUrl: r.photoUrl as string | null,
      orders,
      spend,
      visits: Number(r.visits),
      avgOrderValue: orders > 0 ? spend / orders : 0,
    };
  });

  const maxOf = (key: "spend" | "orders" | "visits" | "avgOrderValue") => Math.max(...candidates.map((c) => c[key]));
  const maxSpend = maxOf("spend");
  const maxOrders = maxOf("orders");
  const maxVisits = maxOf("visits");
  const maxAvgOrderValue = maxOf("avgOrderValue");

  const winner = candidates
    .map((c) => ({
      ...c,
      score:
        0.4 * (maxSpend > 0 ? c.spend / maxSpend : 0) +
        0.25 * (maxOrders > 0 ? c.orders / maxOrders : 0) +
        0.2 * (maxVisits > 0 ? c.visits / maxVisits : 0) +
        0.15 * (maxAvgOrderValue > 0 ? c.avgOrderValue / maxAvgOrderValue : 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  const favoriteRaw = await prisma.$queryRaw<any[]>`
    SELECT ti."name", SUM(ti."quantity") as qty
    FROM "TransactionItem" ti
    JOIN "Transaction" t ON ti."transactionId" = t."id"
    WHERE t."customerId" = ${winner.id} AND t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${monthStart}
    GROUP BY ti."name"
    ORDER BY qty DESC
    LIMIT 1
  `;

  const customer = await prisma.customer.findUnique({ where: { id: winner.id }, select: { lastPurchaseDate: true } });

  return {
    id: winner.id,
    name: winner.name,
    phone: winner.phone,
    photoUrl: winner.photoUrl,
    totalOrders: winner.orders,
    totalSpent: winner.spend,
    avgOrderValue: winner.avgOrderValue,
    visits: winner.visits,
    favoriteItem: (favoriteRaw[0]?.name as string | undefined) ?? null,
    lastVisit: customer?.lastPurchaseDate ?? null,
  };
}

// Profit & Loss for [from, to). Revenue is what customers were billed (netAmount); GST collected
// is a liability, not income, so it's removed to get net sales. COGS uses the purchase price
// snapshotted on each sale line; expenses come from the Expense ledger by date. Callers must check
// VIEW_PROFIT. Line items are fetched per in-range sale (OFFSET 0 fence, see windowedLinesSql) so
// the cost stays proportional to this tenant's period, not the platform's line-item table.
export async function getProfitAndLoss(tenantId: string, from: Date, to: Date) {
  const [salesRow, cogsRow, expenseRows] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { netAmount: true, taxAmount: true },
      _count: true,
      where: { tenantId, status: NOT_HELD, createdAt: { gte: from, lt: to } },
    }),
    prisma.$queryRaw<{ cost: number | string | null }[]>`
      SELECT SUM(l."purchasePrice" * l."quantity") AS cost
      FROM "Transaction" t
      CROSS JOIN LATERAL (
        SELECT ti."purchasePrice", ti."quantity" FROM "TransactionItem" ti WHERE ti."transactionId" = t."id" OFFSET 0
      ) l
      WHERE t."tenantId" = ${tenantId} AND t."status" != 'HELD' AND t."createdAt" >= ${from} AND t."createdAt" < ${to}
    `,
    prisma.expense.groupBy({
      by: ["category"],
      where: { tenantId, date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
  ]);

  const round = (n: number) => Math.round(n * 100) / 100;
  const grossBilled = salesRow._sum.netAmount || 0;
  const taxCollected = salesRow._sum.taxAmount || 0;
  const netSales = grossBilled - taxCollected;
  const costOfGoods = Number(cogsRow[0]?.cost || 0);
  const grossProfit = netSales - costOfGoods;
  const expenses = expenseRows
    .map((r) => ({ category: r.category, total: round(r._sum.amount || 0) }))
    .sort((a, b) => b.total - a.total);
  const totalExpenses = expenses.reduce((s, e) => s + e.total, 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    salesCount: salesRow._count,
    grossBilled: round(grossBilled),
    taxCollected: round(taxCollected),
    netSales: round(netSales),
    costOfGoods: round(costOfGoods),
    grossProfit: round(grossProfit),
    grossMarginPercent: netSales > 0 ? round((grossProfit / netSales) * 100) : 0,
    expenses,
    totalExpenses: round(totalExpenses),
    netProfit: round(netProfit),
    netMarginPercent: netSales > 0 ? round((netProfit / netSales) * 100) : 0,
  };
}
