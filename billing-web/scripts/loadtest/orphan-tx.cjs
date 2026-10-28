// Overload test for orphaned/lost writes: fires a burst of concurrent POS sales, each with a brand
// new customer phone (forcing a customer INSERT outside the sale's DB transaction), while sampling
// Postgres for connections left "idle in transaction". Afterwards checks every customer the server
// claims to have created actually exists, and that no sale references a missing customer.
//
//   BASE_URL=http://localhost:3100 LT_BURST=40 node scripts/loadtest/orphan-tx.cjs
require('dotenv/config');
const { Client } = require('pg');
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const BURST = Number(process.env.LT_BURST || 40);

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const T = (await db.query(`select id from "Tenant" where name='LOADTEST-BIG'`)).rows[0].id;
  const p = (await db.query(`select id, "salePrice" from "Product" where "tenantId"=$1 and barcode='LTB2'`, [T])).rows[0];

  const cookies = new Map();
  const store = (r) => { for (const c of r.headers.getSetCookie?.() || []) { const [x] = c.split(';'); const i = x.indexOf('='); cookies.set(x.slice(0, i), x.slice(i + 1)); } };
  const hdr = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  let r = await fetch(`${BASE}/api/auth/csrf`); store(r); const { csrfToken } = await r.json();
  r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: hdr() },
    body: new URLSearchParams({ csrfToken, email: 'owner@loadtest.invalid', password: process.env.LT_PASSWORD || 'LoadTest#2026', json: 'true' }).toString() });
  store(r);

  let maxIdleInTx = 0;
  const sampler = setInterval(async () => {
    try {
      const n = Number((await db.query(`select count(*) n from pg_stat_activity where datname=current_database() and state like 'idle in transaction%'`)).rows[0].n);
      maxIdleInTx = Math.max(maxIdleInTx, n);
    } catch { /* best effort */ }
  }, 250);

  const phones = Array.from({ length: BURST }, () => '6' + String(100000000 + Math.floor(Math.random() * 899999999)));
  const res = await Promise.all(phones.map((ph) => fetch(`${BASE}/api/transactions`, {
    method: 'POST',
    headers: { cookie: hdr(), 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
    body: JSON.stringify({ items: [{ productId: p.id, quantity: 1, salePrice: p.salePrice }], customerPhone: ph, paymentMethod: 'CASH', amountReceived: 100000 }),
  }).then((x) => x.status).catch(() => -1)));
  await new Promise((done) => setTimeout(done, 3000));
  clearInterval(sampler);

  const codes = {};
  for (const s of res) codes[s] = (codes[s] || 0) + 1;
  const customers = Number((await db.query(`select count(*) n from "Customer" where "tenantId"=$1 and phone = any($2)`, [T, phones])).rows[0].n);
  const sales = Number((await db.query(`select count(*) n from "Transaction" t join "Customer" c on c.id = t."customerId" where t."tenantId"=$1 and c.phone = any($2)`, [T, phones])).rows[0].n);
  const orphanSales = Number((await db.query(`select count(*) n from "Transaction" t where t."customerId" is not null and not exists (select 1 from "Customer" c where c.id = t."customerId")`)).rows[0].n);
  const stillIdleInTx = Number((await db.query(`select count(*) n from pg_stat_activity where datname=current_database() and state like 'idle in transaction%'`)).rows[0].n);

  console.log(JSON.stringify({ burst: BURST, statuses: codes, sales201: codes[201] || 0, salesInDb: sales, customersCreated: customers, orphanSales, maxIdleInTxDuringBurst: maxIdleInTx, idleInTxAfter3s: stillIdleInTx }, null, 2));
  await db.end();
})().catch((e) => { console.error(e); process.exit(1); });
