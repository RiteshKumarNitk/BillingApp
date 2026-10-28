// Removes everything scripts/loadtest/seed.cjs created (and any orders/sales the load test itself
// created inside load-test tenants). Tenant deletion cascades to nearly all tenant-owned rows;
// the few relations without cascade are deleted explicitly first.
//
//   node scripts/loadtest/cleanup.cjs
require('dotenv/config');
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const ids = (await c.query(`select id from "Tenant" where name like 'LOADTEST-%' and domain like '%.loadtest.invalid'`)).rows.map((r) => r.id);
  console.log(`load-test tenants: ${ids.length}`);
  await c.query('BEGIN');
  const run = async (label, sql, params) => {
    const r = await c.query(sql, params);
    console.log(`${label.padEnd(30)} ${r.rowCount}`);
  };
  // Relations with ON DELETE RESTRICT (no cascade from Tenant) go first.
  await run('TransactionPayment', `delete from "TransactionPayment" where "transactionId" in (select id from "Transaction" where "tenantId" = any($1))`, [ids]);
  await run('TransactionEditHistory', `delete from "TransactionEditHistory" where "transactionId" in (select id from "Transaction" where "tenantId" = any($1))`, [ids]);
  await run('TransactionItem', `delete from "TransactionItem" where "transactionId" in (select id from "Transaction" where "tenantId" = any($1))`, [ids]);
  await run('Notification', `delete from "Notification" where "tenantId" = any($1)`, [ids]);
  await run('OrderRequest', `delete from "OrderRequest" where "tenantId" = any($1)`, [ids]);
  await run('Transaction', `delete from "Transaction" where "tenantId" = any($1)`, [ids]);
  await run('ComboItem', `delete from "ComboItem" where "comboId" in (select id from "Product" where "tenantId" = any($1))`, [ids]);
  await run('Tenant (cascades)', `delete from "Tenant" where id = any($1)`, [ids]);
  await run('CustomerAccount', `delete from "CustomerAccount" where email like '%@loadtest.invalid'`);
  await run('SubscriptionPlan', `delete from "SubscriptionPlan" where name = 'LOADTEST plan'`);
  await c.query('COMMIT');
  await c.end();
})().catch((e) => { console.error('CLEANUP FAILED (rolled back):', e.message); process.exit(1); });
