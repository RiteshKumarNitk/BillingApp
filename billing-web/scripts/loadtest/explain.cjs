// EXPLAIN ANALYZE for the hot query shapes behind each high-traffic screen, run against the
// load-test tenant. Flags sequential scans on large tables and slow executions.
//
//   node scripts/loadtest/explain.cjs [--verbose]
require('dotenv/config');
const { Client } = require('pg');

const VERBOSE = process.argv.includes('--verbose');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const T = (await c.query(`select id from "Tenant" where name='LOADTEST-BIG'`)).rows[0]?.id;
  if (!T) throw new Error('Run scripts/loadtest/seed.cjs first');
  const acct = (await c.query(`select "customerAccountId" a from "OrderRequest" where "tenantId"=$1 limit 1`, [T])).rows[0].a;
  const tz = 'Asia/Kolkata';
  const d30 = new Date(Date.now() - 30 * 864e5);
  const d1 = new Date(Date.now() - 864e5);
  const d90 = new Date(Date.now() - 90 * 864e5);

  const Q = [
    ['dashboard: all-time sales sum', `select sum("netAmount") from "Transaction" where "tenantId"=$1 and status<>'HELD'`, [T]],
    ['dashboard: today sales', `select sum("netAmount"), count(*) from "Transaction" where "tenantId"=$1 and status<>'HELD' and "createdAt">=$2`, [T, d1]],
    ['dashboard: best/worst products (90d)', `select p.id, sum(ti.quantity) s from "Transaction" t join "TransactionItem" ti on ti."transactionId"=t.id join "Product" p on ti."productId"=p.id where t."tenantId"=$1 and t.status<>'HELD' and t."createdAt">=$2 group by p.id order by s desc`, [T, d90]],
    ['dashboard: category chart (90d)', `select p.category, sum(ti."itemTotal") from "Transaction" t join "TransactionItem" ti on ti."transactionId"=t.id join "Product" p on ti."productId"=p.id where p.category is not null and t."tenantId"=$1 and t.status<>'HELD' and t."createdAt">=$2 group by p.category order by 2 desc limit 5`, [T, d90]],
    ['dashboard: profit trend 30d', `with tx as (select t.id, t."netAmount", date((t."createdAt" at time zone 'UTC') at time zone $3) as day from "Transaction" t where t."createdAt">=$2 and t."tenantId"=$1 and t.status<>'HELD'), c as (select ti."transactionId", sum(ti."purchasePrice"*ti.quantity) cost from "TransactionItem" ti join tx on tx.id=ti."transactionId" group by 1) select tx.day, sum(tx."netAmount"), sum(c.cost) from tx join c on c."transactionId"=tx.id group by 1 order by 1`, [T, d30, tz]],
    ['dashboard: peak hours 30d', `select extract(hour from (("createdAt" at time zone 'UTC') at time zone $3)) h, sum("netAmount") from "Transaction" where "tenantId"=$1 and status<>'HELD' and "createdAt">=$2 group by 1`, [T, d30, tz]],
    ['dashboard: payment summary 30d', `select tp.method, sum(tp.amount) from "TransactionPayment" tp join "Transaction" t on tp."transactionId"=t.id where t."tenantId"=$1 and t.status<>'HELD' and t."createdAt">=$2 group by 1`, [T, d30]],
    ['dashboard: top customers (all-time)', `select c.id, count(t.id), sum(t."netAmount") s from "Transaction" t join "Customer" c on t."customerId"=c.id where t."tenantId"=$1 and t.status<>'HELD' group by c.id order by s desc limit 10`, [T]],
    ['dashboard: low-stock count', `select count(*) from "Product" where "tenantId"=$1 and stock <= "minStockThreshold"`, [T]],
    ['transactions page: list p1', `select * from "Transaction" where "tenantId"=$1 and status<>'HELD' order by "createdAt" desc limit 20 offset 0`, [T]],
    ['transactions page: count', `select count(*) from "Transaction" where "tenantId"=$1 and status<>'HELD'`, [T]],
    ['transactions page: deep page (offset 50k)', `select * from "Transaction" where "tenantId"=$1 and status<>'HELD' order by "createdAt" desc limit 20 offset 50000`, [T]],
    ['transactions page: search customer name', `select * from "Transaction" where "tenantId"=$1 and status<>'HELD' and "customerName" ilike '%cust%' order by "createdAt" desc limit 20`, [T]],
    ['invoice: items of one sale', `select * from "TransactionItem" where "transactionId"=(select id from "Transaction" where "tenantId"=$1 limit 1)`, [T]],
    ['customers page: list by spend', `select * from "Customer" where "tenantId"=$1 order by "totalSpent" desc limit 25 offset 0`, [T]],
    ['customers page: search name', `select * from "Customer" where "tenantId"=$1 and (name ilike '%customer 1234%' or phone like '%12345%') order by "totalSpent" desc limit 25`, [T]],
    ['customer detail: sales', `select id from "Transaction" where "customerId"=(select id from "Customer" where "tenantId"=$1 limit 1) and "tenantId"=$1 and status='COMPLETED' order by "createdAt" desc limit 50`, [T]],
    ['POS: customer by phone', `select * from "Customer" where "tenantId"=$1 and phone='7000012345'`, [T]],
    ['order queue: completed tab', `select * from "OrderRequest" where "tenantId"=$1 and status='COMPLETED' order by "createdAt" desc, id desc limit 51`, [T]],
    ['order queue: status counts', `select status, count(*) from "OrderRequest" where "tenantId"=$1 group by status`, [T]],
    ['kitchen: POS tickets', `select * from "Transaction" where "tenantId"=$1 and "kitchenStatus" in ('PREPARING','READY')`, [T]],
    ['kitchen: online tickets', `select * from "OrderRequest" where "tenantId"=$1 and status in ('ACCEPTED','PREPARING','READY')`, [T]],
    ['app: my orders', `select * from "OrderRequest" where "customerAccountId"=$1 order by "createdAt" desc, id desc limit 51`, [acct]],
    ['app: notifications', `select * from "Notification" where "customerAccountId"=$1 order by "createdAt" desc limit 50`, [acct]],
    ['app: unread count', `select count(*) from "Notification" where "customerAccountId"=$1 and "isRead"=false`, [acct]],
    ['site: resolve tenant by slug', `select * from "Tenant" where "websiteSlug"=$1 or website=$1 or domain=$1 limit 1`, ['loadtest-t999']],
    ['site: menu (public products)', `select id,name,"salePrice" from "Product" where "tenantId"=$1 and "isAvailable"=true order by name`, [T]],
    ['website stats: 30d visits', `select count(*) from "WebsiteVisit" where "tenantId"=$1 and "createdAt">=$2`, [T, d30]],
    ['website stats: top paths', `select path, count(*) from "WebsiteVisit" where "tenantId"=$1 group by path order by 2 desc limit 10`, [T]],
    ['superadmin: tenants search', `select * from "Tenant" where name ilike '%loadtest-t5%' order by "createdAt" desc limit 20`, []],
    ['audit logs: tenant latest', `select * from "AuditLog" where "tenantId"=$1 order by "createdAt" desc limit 50`, [T]],
  ];

  const rows = [];
  for (const [label, sql, params] of Q) {
    const r = await c.query(`explain (analyze, buffers, format json) ${sql}`, params);
    const plan = r.rows[0]['QUERY PLAN'][0];
    const seq = [];
    (function walk(n) {
      if (n['Node Type'] === 'Seq Scan' && (n['Actual Rows'] * (n['Actual Loops'] || 1) > 1000 || (n['Rows Removed by Filter'] || 0) > 1000)) seq.push(n['Relation Name']);
      (n.Plans || []).forEach(walk);
    })(plan.Plan);
    const ms = plan['Execution Time'];
    rows.push({ query: label, ms: Number(ms.toFixed(1)), seqScans: [...new Set(seq)].join(',') || '-', flag: ms > 100 ? 'SLOW' : seq.length ? 'SEQ' : '' });
    if (VERBOSE) console.log(label, JSON.stringify(plan.Plan, null, 1).slice(0, 3000));
  }
  console.table(rows);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
