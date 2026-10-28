// Seeds a LARGE synthetic dataset for performance / load testing. NEVER run against production.
//
//   node scripts/loadtest/seed.cjs            (uses DATABASE_URL from .env)
//
// Everything created is tagged so scripts/loadtest/cleanup.cjs can remove exactly it:
// tenant names start with "LOADTEST-", domains end in ".loadtest.invalid", emails end in
// "@loadtest.invalid". All bulk rows are generated server-side with generate_series (one round
// trip per table), so seeding is fast even over a high-latency link.
//
// Prints the credentials of the seeded "big" tenant's owner and cashier for the load test.
require('dotenv/config');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const SCALE = {
  smallTenants: Number(process.env.LT_SMALL_TENANTS || 1000),
  products: Number(process.env.LT_PRODUCTS || 300),
  customers: Number(process.env.LT_CUSTOMERS || 30000),
  transactions: Number(process.env.LT_TRANSACTIONS || 100000),
  orders: Number(process.env.LT_ORDERS || 30000),
  visits: Number(process.env.LT_VISITS || 100000),
  customerAccounts: Number(process.env.LT_CUSTOMER_ACCOUNTS || 2000),
  notifications: Number(process.env.LT_NOTIFICATIONS || 20000),
  auditLogs: Number(process.env.LT_AUDIT_LOGS || 50000),
};

const OWNER_EMAIL = 'owner@loadtest.invalid';
const CASHIER_EMAIL = 'cashier@loadtest.invalid';
const PASSWORD = process.env.LT_PASSWORD || 'LoadTest#2026';

const ALL_PERMISSIONS = ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT', 'OVERRIDE_PRICE', 'EDIT_TRANSACTION', 'REOPEN_OLD_TRANSACTION'];

async function main() {
  if (/prod/i.test(process.env.DATABASE_URL || '') && process.env.LT_I_KNOW_THIS_IS_NOT_PROD !== '1') {
    throw new Error('DATABASE_URL looks like production. Refusing to seed load-test data.');
  }
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const q = async (label, sql, params = []) => {
    const t = Date.now();
    const r = await c.query(sql, params);
    console.log(`${label.padEnd(34)} ${String(r.rowCount ?? '').padStart(8)} rows  ${Date.now() - t} ms`);
    return r;
  };

  const existing = await c.query(`select id from "Tenant" where name = 'LOADTEST-BIG'`);
  if (existing.rowCount) throw new Error('Load-test data already present. Run scripts/loadtest/cleanup.cjs first.');

  const hash = await bcrypt.hash(PASSWORD, 10);

  await c.query('BEGIN');
  // A plan every load-test tenant subscribes to (unlimited everything).
  const plan = await q('plan', `insert into "SubscriptionPlan"(id,name,amount,interval,"maxProducts","maxUsers","maxTransactions","maxTables","updatedAt")
    values (gen_random_uuid(),'LOADTEST plan',0,'MONTHLY',-1,-1,-1,-1,now()) returning id`);
  const planId = plan.rows[0].id;

  // ---- The busy cafe everything is measured against ----
  const big = await q('big tenant', `insert into "Tenant"(id,name,domain,status,"businessType","websiteSlug",timezone,"updatedAt",phone,email,address,city,"aadharCardUrl",gstin)
    values (gen_random_uuid(),'LOADTEST-BIG','big.loadtest.invalid','ACTIVE','CAFE','loadtest-big','Asia/Kolkata',now(),'9000000001','big@loadtest.invalid','1 Test Road','Bengaluru','https://example.invalid/SECRET-AADHAAR-DOC.pdf','29AAAAA0000A1Z5') returning id`);
  const T = big.rows[0].id;
  await q('big: subscription', `insert into "TenantSubscription"(id,"tenantId","planId",status,"endDate","updatedAt") values (gen_random_uuid(),$1,$2,'ACTIVE',now()+interval '5 years',now())`, [T, planId]);
  await q('big: shop', `insert into "Shop"(id,"tenantId",name,"defaultTaxRate") values (gen_random_uuid(),$1,'LOADTEST-BIG',5)`, [T]);
  await q('big: website', `insert into "Website"(id,"tenantId",theme,"updatedAt") values (gen_random_uuid(),$1,'modern-restaurant',now())`, [T]);
  const roles = await q('big: roles', `insert into "Role"(id,"tenantId",name,permissions,"updatedAt") values
    (gen_random_uuid(),$1,'Owner',$2,now()), (gen_random_uuid(),$1,'Cashier',$3,now()) returning id,name`, [T, ALL_PERMISSIONS, ['CREATE_BILL']]);
  const ownerRole = roles.rows.find((r) => r.name === 'Owner').id;
  const cashierRole = roles.rows.find((r) => r.name === 'Cashier').id;
  const users = await q('big: users', `insert into "User"(id,email,password,name,role,"tenantId","tenantRoleId","updatedAt") values
    (gen_random_uuid(),$1,$3,'LT Owner','ADMIN',$4,$5,now()), (gen_random_uuid(),$2,$3,'LT Cashier','USER',$4,$6,now()) returning id`, [OWNER_EMAIL, CASHIER_EMAIL, hash, T, ownerRole, cashierRole]);
  const ownerId = users.rows[0].id;

  // Products: large stock so load tests never fail on stock, plus one "last item" (stock 1) for
  // the concurrent-last-item race test.
  await q('big: products', `insert into "Product"(id,name,barcode,"purchasePrice",mrp,"salePrice",stock,category,"tenantId","updatedAt","gstRate","isAvailable","minStockThreshold")
    select gen_random_uuid(), 'LT Item '||g, 'LTB'||g, 40+(g%60), 120+(g%80), 100+(g%80), 1000000, 'Category '||(g%12), $1, now(), case when g%3=0 then 5 else null end, true, 10
    from generate_series(1,$2) g`, [T, SCALE.products]);
  await q('big: last-item product', `insert into "Product"(id,name,barcode,"purchasePrice",mrp,"salePrice",stock,category,"tenantId","updatedAt","isAvailable")
    values (gen_random_uuid(),'LT LAST ITEM','LTB-LAST',10,50,40,1,'Race','${T}',now(),true)`);

  await q('big: customers', `insert into "Customer"(id,name,phone,"tenantId","totalSpent","loyaltyPoints","createdDate")
    select gen_random_uuid(), 'LT Customer '||g, (7000000000+g)::text, $1, (g%5000)::float, g%300, now() - (random()*365||' days')::interval
    from generate_series(1,$2) g`, [T, SCALE.customers]);

  // Sales spread over the last year, ~70% linked to a customer.
  await q('big: transactions', `
    with c as (select array_agg(id) a from "Customer" where "tenantId"=$1)
    insert into "Transaction"(id,"tenantId","userId",status,"totalAmount","netAmount","taxAmount","createdAt","updatedAt","customerId","paymentMethod","orderType","kitchenStatus")
    select gen_random_uuid(), $1, $2, 'COMPLETED', x.amt, x.amt*1.05, x.amt*0.05, x.ts, x.ts,
           case when random() < 0.7 then c.a[1+floor(random()*array_length(c.a,1))::int] else null end,
           (array['CASH','UPI','CARD'])[1+floor(random()*3)::int], 'TAKE_AWAY', case when g%500=0 then 'PREPARING' else null end
    from generate_series(1,$3) g, c,
         -- "where g = g" correlates the subquery with each row, so random() is drawn per row.
         lateral (select (100+random()*900)::numeric(10,2)::float amt, now() - (random()*365||' days')::interval ts where g = g) x`, [T, ownerId, SCALE.transactions]);

  await q('big: transaction items', `
    with p as (select array_agg(id) a from "Product" where "tenantId"=$1)
    insert into "TransactionItem"(id,"transactionId","productId",name,barcode,"purchasePrice",mrp,"salePrice",quantity,"itemTotal")
    select gen_random_uuid(), t.id, p.a[1+floor(random()*array_length(p.a,1))::int], 'LT Item', 'LTB', 50, 150, 120, q, q*120
    from "Transaction" t, p, lateral generate_series(1, 1+floor(random()*4)::int + (length(t.id)*0)) n, lateral (select (1+floor(random()*3))::float q where n is not null) qq
    where t."tenantId"=$1`, [T]);

  await q('big: transaction payments', `insert into "TransactionPayment"(id,"transactionId",method,amount,"createdAt")
    select gen_random_uuid(), id, "paymentMethod", "netAmount", "createdAt" from "Transaction" where "tenantId"=$1`, [T]);

  await q('customer accounts', `insert into "CustomerAccount"(id,email,password,name,"tokenVersion","updatedAt")
    select gen_random_uuid(), 'ca'||g||'@loadtest.invalid', $1, 'LT Account '||g, 0, now() from generate_series(1,$2) g`, [hash, SCALE.customerAccounts]);

  await q('big: order requests', `
    with a as (select array_agg(id) a from "CustomerAccount" where email like '%@loadtest.invalid')
    insert into "OrderRequest"(id,status,"totalAmount","netAmount","tenantId","customerAccountId","orderType","createdAt","updatedAt")
    select gen_random_uuid(), (array['PENDING','ACCEPTED','PREPARING','READY','COMPLETED','COMPLETED','COMPLETED','REJECTED'])[1+floor(random()*8)::int],
           amt, amt, $1, a.a[1+floor(random()*array_length(a.a,1))::int], 'TAKE_AWAY', ts, ts
    from generate_series(1,$2) g, a, lateral (select (100+random()*500)::float amt, now() - (random()*180||' days')::interval ts where g = g) x`, [T, SCALE.orders]);

  await q('big: order request items', `
    with p as (select array_agg(id) a from "Product" where "tenantId"=$1)
    insert into "OrderRequestItem"(id,"orderRequestId","productId",name,"salePrice",quantity,"itemTotal")
    select gen_random_uuid(), o.id, p.a[1+floor(random()*array_length(p.a,1))::int], 'LT Item', 120, 1, 120
    from "OrderRequest" o, p, lateral generate_series(1, 1+floor(random()*2)::int + (length(o.id)*0)) n where o."tenantId"=$1`, [T]);

  await q('big: website visits', `
    insert into "WebsiteVisit"(id,"websiteId","tenantId",path,"createdAt")
    select gen_random_uuid(), w.id, $1, (array['/','/shop','/about','/contact'])[1+floor(random()*4)::int], now() - (random()*90||' days')::interval
    from generate_series(1,$2) g, (select id from "Website" where "tenantId"=$1) w`, [T, SCALE.visits]);

  await q('big: notifications', `
    with a as (select array_agg(id) a from "CustomerAccount" where email like '%@loadtest.invalid')
    insert into "Notification"(id,title,message,"tenantId","customerAccountId","isRead","createdAt","updatedAt")
    select gen_random_uuid(), 'LT', 'Order update', $1, a.a[1+floor(random()*array_length(a.a,1))::int], random()<0.5, ts, ts
    from generate_series(1,$2) g, a, lateral (select now() - (random()*90||' days')::interval ts where g = g) x`, [T, SCALE.notifications]);

  await q('big: audit logs', `insert into "AuditLog"(id,"tenantId","userId",action,details,"createdAt")
    select gen_random_uuid(), $1, $2, 'LT_ACTION', 'load test', now() - (random()*365||' days')::interval from generate_series(1,$3) g`, [T, ownerId, SCALE.auditLogs]);

  // ---- Many small tenants (tenant-table scans, slug lookups, superadmin lists) ----
  await q('small tenants', `insert into "Tenant"(id,name,domain,status,"businessType","websiteSlug","updatedAt")
    select gen_random_uuid(), 'LOADTEST-T'||g, 't'||g||'.loadtest.invalid', 'ACTIVE', 'CAFE', 'loadtest-t'||g, now() from generate_series(1,$1) g`, [SCALE.smallTenants]);
  await q('small tenants: websites', `insert into "Website"(id,"tenantId",theme,"updatedAt")
    select gen_random_uuid(), id, 'modern-restaurant', now() from "Tenant" where name like 'LOADTEST-T%'`);
  await q('small tenants: subscriptions', `insert into "TenantSubscription"(id,"tenantId","planId",status,"endDate","updatedAt")
    select gen_random_uuid(), id, $1, 'ACTIVE', now()+interval '5 years', now() from "Tenant" where name like 'LOADTEST-T%'`, [planId]);
  await q('small tenants: products', `insert into "Product"(id,name,"salePrice",stock,"tenantId","updatedAt")
    select gen_random_uuid(), 'LT small item '||n, 99, 100, t.id, now() from "Tenant" t, generate_series(1,20) n where t.name like 'LOADTEST-T%'`);

  await c.query('COMMIT');
  console.log('ANALYZE ...');
  await c.query('ANALYZE');
  const size = await c.query(`select pg_size_pretty(pg_database_size(current_database())) s`);
  console.log(`\nDone. Database size now ${size.rows[0].s}.`);
  console.log(JSON.stringify({ tenantId: T, slug: 'loadtest-big', owner: OWNER_EMAIL, cashier: CASHIER_EMAIL, password: PASSWORD }, null, 2));
  await c.end();
}

main().catch(async (e) => {
  console.error('SEED FAILED (transaction rolled back):', e.message);
  process.exit(1);
});
