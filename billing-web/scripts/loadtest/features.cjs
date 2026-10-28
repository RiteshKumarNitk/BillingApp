// End-to-end checks for the Tier 1 features against a RUNNING server + the load-test dataset.
// Each check compares the feature's output with an independent SQL computation.
//
//   BASE_URL=http://localhost:3100 JWT_SECRET=<server's> node scripts/loadtest/features.cjs
require('dotenv/config');
const { Client } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const PASSWORD = process.env.LT_PASSWORD || 'LoadTest#2026';
const results = [];
const check = (area, name, pass, detail = '') => results.push({ area, check: name, result: pass ? 'PASS' : 'FAIL', detail: String(detail).slice(0, 110) });

function jar() {
  const cookies = new Map();
  // Each simulated client gets its own address, so per-IP rate limits (guest orders: 10 / 10 min)
  // see distinct customers instead of one machine.
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const store = (res) => { for (const c of res.headers.getSetCookie?.() || []) { const [p] = c.split(';'); const i = p.indexOf('='); cookies.set(p.slice(0, i), p.slice(i + 1)); } };
  const hdr = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    async req(method, path, body, headers = {}) {
      const res = await fetch(BASE + path, { method, redirect: 'manual', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, cookie: hdr(), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
      store(res);
      const text = await res.text();
      let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
      return { status: res.status, text, json, headers: res.headers };
    },
    async bytes(path) {
      const res = await fetch(BASE + path, { headers: { cookie: hdr() } });
      return new Uint8Array(await res.arrayBuffer());
    },
    async login(email) {
      const c = await this.req('GET', '/api/auth/csrf');
      const res = await fetch(BASE + '/api/auth/callback/credentials', { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: hdr() },
        body: new URLSearchParams({ csrfToken: c.json.csrfToken, email, password: PASSWORD, json: 'true' }).toString() });
      store(res);
      if (!hdr().includes('session-token')) throw new Error(`login failed: ${email}`);
    },
  };
}

// Parse a CSV produced by /api/export (handles quotes, BOM).
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const close = (a, b) => Math.abs(a - b) < 0.05;
const inr = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, p) => (await db.query(sql, p)).rows[0];
  const T = (await one(`select id from "Tenant" where name='LOADTEST-BIG'`)).id;
  const OTHER = (await one(`select id from "Tenant" where name='LOADTEST-T1'`)).id;
  const product = await one(`select id, "salePrice" from "Product" where "tenantId"=$1 and barcode='LTB5'`, [T]);
  // Re-runnable: remove this script's own fixtures from any previous run first.
  await db.query(`delete from "Customer" where "tenantId"=$1 and phone='7999999999'`, [T]);
  await db.query(`delete from "Discount" where "tenantId"=$1 and name like 'LT %'`, [T]);
  await db.query(`delete from "Expense" where "tenantId"=$1 and name like 'LT %'`, [T]);
  const owner = jar(); await owner.login('owner@loadtest.invalid');
  const cashier = jar(); await cashier.login('cashier@loadtest.invalid');
  const month = await one(`select to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM') m`);
  // Month bounds as UTC wall-clock TEXT, computed in Postgres. (Passing JS Dates through node-pg
  // against a `timestamp without time zone` column shifts them by the machine's UTC offset.)
  const monthStart = await one(`select to_char((date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') s, to_char(((date_trunc('month', now() at time zone 'Asia/Kolkata') + interval '1 month') at time zone 'Asia/Kolkata') at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') e`);

  // ---------- 1. Expenses + P&L ----------
  {
    const add = await owner.req('POST', '/api/tenant/expenses', { name: 'LT Rent', category: 'RENT', amount: 25000 });
    await owner.req('POST', '/api/tenant/expenses', { name: 'LT Milk', category: 'SUPPLIES', amount: 4321.5 });
    const cashierAdd = await cashier.req('POST', '/api/tenant/expenses', { name: 'x', amount: 1 });
    check('Expenses', 'Owner can add an expense (API)', add.status === 201, add.status);
    check('Expenses', 'Cashier blocked from the expense ledger', cashierAdd.status === 403, cashierAdd.status);
    const page = await owner.req('GET', '/expenses');
    check('Expenses', 'Expenses page lists this month', page.status === 200 && page.text.includes('LT Rent') && page.text.includes(inr(29321.5)), `status ${page.status}`);
    const denied = await cashier.req('GET', '/expenses');
    check('Expenses', 'Expenses page denied to Cashier', denied.text.includes('Access Denied'), denied.status);

    const s = await one(`select coalesce(sum("netAmount"),0) net, coalesce(sum("taxAmount"),0) tax, count(*) n from "Transaction" where "tenantId"=$1 and status<>'HELD' and "createdAt">=$2 and "createdAt"<$3`, [T, monthStart.s, monthStart.e]);
    const cogs = await one(`select coalesce(sum(i."purchasePrice"*i.quantity),0) c from "TransactionItem" i join "Transaction" t on t.id=i."transactionId" where t."tenantId"=$1 and t.status<>'HELD' and t."createdAt">=$2 and t."createdAt"<$3`, [T, monthStart.s, monthStart.e]);
    const exp = await one(`select coalesce(sum(amount),0) a from "Expense" where "tenantId"=$1 and date>=$2 and date<$3`, [T, monthStart.s, monthStart.e]);
    const netSales = Number(s.net) - Number(s.tax);
    const netProfit = netSales - Number(cogs.c) - Number(exp.a);
    const r = await owner.req('GET', `/reports?pl=${month.m}`);
    const showsNetSales = r.text.includes(inr(Math.round(netSales * 100) / 100));
    const showsNetProfit = r.text.includes(inr(Math.round(netProfit * 100) / 100));
    check('P&L', 'Net sales on Reports = independent SQL', r.status === 200 && showsNetSales, `expected ${inr(netSales)} (${s.n} sales)`);
    check('P&L', 'Net profit on Reports = independent SQL', showsNetProfit, `expected ${netProfit < 0 ? '−' : ''}${inr(netProfit)}`);
    const managerless = await cashier.req('GET', '/reports');
    check('P&L', 'P&L hidden without VIEW_PROFIT', !managerless.text.includes('Profit &amp; Loss') && !managerless.text.includes('Profit & Loss'), managerless.status);
  }

  // ---------- 2. CSV exports ----------
  {
    const sales = await owner.req('GET', `/api/export/sales?month=${month.m}`);
    const rows = parseCsv(sales.text);
    const header = rows[0]; const data = rows.slice(1).filter((r) => r.length > 1);
    const netIdx = header.indexOf('Net');
    const csvNet = data.reduce((sum, r) => sum + Number(r[netIdx]), 0);
    // Each invoice is rounded to paise in the CSV (what the invoice shows), so compare against the
    // sum of rounded invoices. The unrounded float sum differs by a few rupees — see M10 (Float money).
    const db1 = await one(`select count(*) n, coalesce(sum(round("netAmount"::numeric, 2)),0) net, coalesce(sum("netAmount"),0) raw from "Transaction" where "tenantId"=$1 and status<>'HELD' and "createdAt">=$2 and "createdAt"<$3`, [T, monthStart.s, monthStart.e]);
    check('Export', 'Sales CSV row count = DB', data.length === Number(db1.n), `${data.length} vs ${db1.n}`);
    check('Export', 'Sales CSV net total = DB (per-invoice paise)', close(csvNet, Number(db1.net)), `${csvNet.toFixed(2)} vs ${Number(db1.net).toFixed(2)} (unrounded float sum ${Number(db1.raw).toFixed(2)})`);
    check('Export', 'CSV headers (attachment, utf-8, BOM)', /attachment; filename="sales_/.test(sales.headers.get('content-disposition') || '') && (await owner.bytes(`/api/export/sales?month=${month.m}`)).slice(0, 3).join(',') === '239,187,191', sales.headers.get('content-disposition'));

    const gst = parseCsv((await owner.req('GET', `/api/export/gst?month=${month.m}`)).text);
    const total = gst.find((r) => r[0] === 'TOTAL');
    const dbTax = await one(`select coalesce(sum("taxAmount"),0) t from "Transaction" where "tenantId"=$1 and status<>'HELD' and "createdAt">=$2 and "createdAt"<$3`, [T, monthStart.s, monthStart.e]);
    check('Export', 'GST CSV total tax = DB', total && close(Number(total[3]), Number(dbTax.t)), total ? `${total[3]} vs ${Number(dbTax.t).toFixed(2)}` : 'no TOTAL row');

    await db.query(`insert into "Customer"(id,name,phone,"tenantId") values (gen_random_uuid(), '=HYPERLINK("http://evil.invalid","x")', '7999999999', $1)`, [T]);
    const auditBefore = Number((await one(`select count(*) n from "AuditLog" where "tenantId"=$1 and action='EXPORT_CUSTOMERS'`, [T])).n);
    const custText = (await owner.req('GET', '/api/export/customers')).text;
    const cust = parseCsv(custText).slice(1).filter((r) => r.length > 1);
    const dbCust = Number((await one(`select count(*) n from "Customer" where "tenantId"=$1`, [T])).n);
    const auditAfter = Number((await one(`select count(*) n from "AuditLog" where "tenantId"=$1 and action='EXPORT_CUSTOMERS'`, [T])).n);
    check('Export', 'Customers CSV row count = DB (streamed)', cust.length === dbCust, `${cust.length} vs ${dbCust}`);
    check('Export', 'Formula injection neutralised', cust.some((r) => r[0].startsWith("'=HYPERLINK")) && !cust.some((r) => r[0].startsWith('=')), 'cell prefixed with apostrophe');
    check('Export', 'Customer export is audit-logged', auditAfter === auditBefore + 1, `${auditBefore} → ${auditAfter}`);

    const denied = await cashier.req('GET', '/api/export/sales');
    const bad = await owner.req('GET', '/api/export/sales?from=2026-01-01');
    const unknown = await owner.req('GET', '/api/export/passwords');
    const anon = await jar().req('GET', '/api/export/sales');
    check('Export', 'Cashier (no VIEW_REPORTS) → 403', denied.status === 403, denied.status);
    check('Export', 'Half a date range → 400', bad.status === 400, bad.status);
    check('Export', 'Unknown export → 404', unknown.status === 404, unknown.status);
    check('Export', 'Anonymous → 401', anon.status === 401, anon.status);
    const expCsv = parseCsv((await owner.req('GET', `/api/export/expenses?month=${month.m}`)).text);
    const expTotal = expCsv.find((r) => r[0] === 'TOTAL');
    check('Export', 'Expenses CSV total = DB', expTotal && close(Number(expTotal[3]), 29321.5), expTotal && expTotal[3]);
  }

  // ---------- 3. Discounts page ----------
  {
    await db.query(`insert into "Discount"(id,name,code,"discountPercentage","tenantId","isActive","startDate","endDate") values
      (gen_random_uuid(),'LT Live coupon','LTLIVE10',10,$1,true,null,null),
      (gen_random_uuid(),'LT Future offer',null,5,$1,true,now()+interval '10 days',null),
      (gen_random_uuid(),'LT Old coupon','LTOLD',15,$1,true,null,now()-interval '1 day')`, [T]);
    const page = await owner.req('GET', '/discounts');
    const text = page.text;
    check('Discounts', 'Page lists coupons and automatic offers', page.status === 200 && text.includes('LTLIVE10') && text.includes('LT Future offer') && text.includes('Automatic (online)'), page.status);
    check('Discounts', 'States computed (live / scheduled / expired)', text.includes('>live<') && text.includes('>scheduled<') && text.includes('>expired<'), '');
    const denied = await cashier.req('GET', '/discounts');
    check('Discounts', 'Denied to Cashier (no EDIT_PRODUCT)', denied.text.includes('Access Denied'), denied.status);
    const sale = await owner.req('POST', '/api/transactions', { items: [{ productId: product.id, quantity: 2, salePrice: product.salePrice }], customerPhone: '9988776655', paymentMethod: 'CASH', amountReceived: 100000, couponCode: 'ltlive10' }, { 'idempotency-key': crypto.randomUUID() });
    const expected = Math.round(product.salePrice * 2 * 0.1 * 100) / 100;
    check('Discounts', 'POS applies the coupon (case-insensitive)', sale.status === 201 && close(sale.json.transaction.couponDiscountAmount, expected), sale.status === 201 ? `${sale.json.transaction.couponDiscountAmount} vs ${expected}` : sale.json?.error);
    const expired = await owner.req('POST', '/api/transactions', { items: [{ productId: product.id, quantity: 1, salePrice: product.salePrice }], customerPhone: '9988776655', paymentMethod: 'CASH', amountReceived: 100000, couponCode: 'LTOLD' }, { 'idempotency-key': crypto.randomUUID() });
    check('Discounts', 'POS rejects an expired coupon', expired.status === 400, expired.json?.error);
  }

  // ---------- 4. Guest order tracking ----------
  {
    const guest = jar();
    const o = await guest.req('POST', '/api/customer/orders', { tenantId: 'loadtest-big', items: [{ productId: product.id, quantity: 1 }], guestName: 'Priya Sharma', guestPhone: '9811122233' }, { 'idempotency-key': crypto.randomUUID() });
    const id = o.json.order.id;
    const page = await jar().req('GET', `/track/loadtest-big/${id}`);
    check('Tracking', 'Guest can open their order page', page.status === 200 && page.text.replace(/<!-- -->/g, '').includes(`#${id.slice(0, 8)}`) && page.text.includes('Order received'), page.status);
    check('Tracking', 'Shows first name only, never the phone', page.text.includes('Priya') && !page.text.includes('Sharma') && !page.text.includes('9811122233'), '');
    check('Tracking', 'Marked noindex', /<meta name="robots" content="noindex, nofollow"/.test(page.text), '');
    check('Tracking', 'Auto-refresh while in progress', page.text.includes('This page updates automatically'), '');
    const rand = await jar().req('GET', `/track/loadtest-big/${crypto.randomUUID()}`);
    const otherTenantOrder = await one(`insert into "OrderRequest"(id,status,"tenantId","updatedAt") values (gen_random_uuid(),'PENDING',$1,now()) returning id`, [OTHER]);
    const cross = await jar().req('GET', `/track/loadtest-big/${otherTenantOrder.id}`);
    const junk = await jar().req('GET', `/track/loadtest-big/not-a-uuid`);
    check('Tracking', 'Unknown order → 404', rand.status === 404, rand.status);
    check('Tracking', "Another cafe's order under this cafe's URL → 404", cross.status === 404, cross.status);
    check('Tracking', 'Malformed id → 404', junk.status === 404, junk.status);
    await db.query(`delete from "OrderRequest" where id=$1`, [otherTenantOrder.id]);
  }

  // ---------- 5 & 6. App: cancel order + loyalty ----------
  {
    const accts = (await db.query(`select id, email, "tokenVersion" from "CustomerAccount" where email like '%@loadtest.invalid' order by email limit 2`)).rows;
    const token = (a) => jwt.sign({ id: a.id, email: a.email, role: 'CUSTOMER', tokenVersion: a.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const A = { authorization: `Bearer ${token(accts[0])}` };
    const B = { authorization: `Bearer ${token(accts[1])}` };
    const place = async () => (await jar().req('POST', '/api/mobile/customer/orders', { tenantId: 'loadtest-big', items: [{ productId: product.id, quantity: 3 }], idempotencyKey: crypto.randomUUID() }, A)).json.order;

    const o1 = await place();
    const other = await jar().req('PATCH', `/api/mobile/customer/orders/${o1.id}`, { action: 'CANCEL' }, B);
    check('Cancel', "Another customer can't cancel my order (404)", other.status === 404, other.status);
    const c1 = await jar().req('PATCH', `/api/mobile/customer/orders/${o1.id}`, { action: 'CANCEL' }, A);
    const c2 = await jar().req('PATCH', `/api/mobile/customer/orders/${o1.id}`, { action: 'CANCEL' }, A);
    const st = (await one(`select status from "OrderRequest" where id=$1`, [o1.id])).status;
    check('Cancel', 'Pending order cancelled', c1.status === 200 && st === 'CANCELLED', `${c1.status} ${st}`);
    check('Cancel', 'Repeat cancel is idempotent (200)', c2.status === 200, c2.status);
    const queue = await owner.req('GET', '/api/tenant/orders?status=CANCELLED');
    check('Cancel', 'Cafe sees it in the Cancelled tab', queue.json.orders.some((x) => x.id === o1.id), '');

    const o2 = await place();
    await owner.req('PATCH', `/api/tenant/orders/${o2.id}`, { action: 'ACCEPT' });
    const late = await jar().req('PATCH', `/api/mobile/customer/orders/${o2.id}`, { action: 'CANCEL' }, A);
    check('Cancel', 'Accepted order → 409 with explanation', late.status === 409 && /contact the cafe/i.test(late.json?.error || ''), late.json?.error);

    const o3 = await place();
    const race = await Promise.all([
      jar().req('PATCH', `/api/mobile/customer/orders/${o3.id}`, { action: 'CANCEL' }, A),
      owner.req('PATCH', `/api/tenant/orders/${o3.id}`, { action: 'ACCEPT' }),
    ]);
    const final = (await one(`select status from "OrderRequest" where id=$1`, [o3.id])).status;
    check('Cancel', 'Cancel racing Accept: exactly one wins', race.filter((r) => r.status === 200).length === 1 && ['CANCELLED', 'ACCEPTED'].includes(final), `${race.map((r) => r.status)} → ${final}`);

    // Loyalty: complete o2 → points at ₹100/point, recorded on the sale too.
    for (const action of ['START_PREPARING', 'MARK_READY']) await owner.req('PATCH', `/api/tenant/orders/${o2.id}`, { action });
    const done = await owner.req('PATCH', `/api/tenant/orders/${o2.id}`, { action: 'COMPLETE', paymentMethod: 'CASH' });
    const ord = await one(`select "netAmount", "customerId", "transactionId" from "OrderRequest" where id=$1`, [o2.id]);
    const tx = await one(`select "loyaltyPointsEarned" from "Transaction" where id=$1`, [ord.transactionId]);
    const expectedPts = Math.floor(ord.netAmount / 100);
    check('Loyalty', 'Online completion earns ₹100/point (was ₹10)', done.status === 200 && tx.loyaltyPointsEarned === expectedPts, `net ${ord.netAmount} → ${tx.loyaltyPointsEarned} pts (expected ${expectedPts})`);
    const loy = await jar().req('GET', '/api/mobile/customer/loyalty', undefined, A);
    const cafe = loy.json?.cafes?.find((c) => c.tenantId === T);
    const dbPts = (await one(`select "loyaltyPoints" from "Customer" where id=$1`, [ord.customerId])).loyaltyPoints;
    check('Loyalty', 'App balance = DB balance', loy.status === 200 && cafe && cafe.points === dbPts, cafe ? `${cafe.points} vs ${dbPts}` : loy.status);
    check('Loyalty', 'Rules served by API (₹100/pt, redeem at counter)', loy.json?.rules?.earnRupeesPerPoint === 100 && loy.json?.rules?.redeemAt === 'COUNTER', JSON.stringify(loy.json?.rules));
    const anon = await jar().req('GET', '/api/mobile/customer/loyalty');
    check('Loyalty', 'Requires login', anon.status === 401, anon.status);
  }

  console.table(results);
  const failed = results.filter((r) => r.result === 'FAIL').length;
  console.log(failed ? `${failed} FAILED of ${results.length}` : `ALL ${results.length} PASSED`);
  await db.end();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(2); });
