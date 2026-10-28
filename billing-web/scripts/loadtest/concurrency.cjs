// Concurrency / integrity tests against a RUNNING server + the load-test dataset (seed.cjs).
// Each scenario fires simultaneous HTTP requests, then checks the database for the invariant.
//
//   BASE_URL=http://localhost:3100 node scripts/loadtest/concurrency.cjs
//
// Never run against production: it creates sales/orders inside the LOADTEST tenant and changes
// one product's stock and one user's session state.
require('dotenv/config');
const { Client } = require('pg');
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const PASSWORD = process.env.LT_PASSWORD || 'LoadTest#2026';
const results = [];
const record = (scenario, pass, detail) => { results.push({ scenario, result: pass ? 'PASS' : 'FAIL', detail }); };

// --- minimal cookie-jar HTTP client -------------------------------------------------------
function jar() {
  const cookies = new Map();
  // Each simulated client gets its own address, so per-IP rate limits (guest orders: 10 / 10 min)
  // see distinct customers instead of one machine.
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const store = (res) => {
    for (const c of res.headers.getSetCookie?.() || []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1));
    }
  };
  const header = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    async req(method, path, body, extraHeaders = {}) {
      const res = await fetch(BASE + path, {
        method,
        redirect: 'manual',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, cookie: header(), ...extraHeaders },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      });
      store(res);
      let json = null;
      const text = await res.text();
      try { json = JSON.parse(text); } catch { /* html */ }
      return { status: res.status, json, text };
    },
    async login(email) {
      const csrf = await this.req('GET', '/api/auth/csrf');
      const form = new URLSearchParams({ csrfToken: csrf.json.csrfToken, email, password: PASSWORD, json: 'true', callbackUrl: BASE + '/dashboard' });
      const res = await this.req('POST', '/api/auth/callback/credentials', form.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
      if (![200, 302].includes(res.status) || !header().includes('session-token')) throw new Error(`login failed for ${email}: ${res.status}`);
    },
  };
}

const key = () => crypto.randomUUID();

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  const T = (await one(`select id from "Tenant" where name='LOADTEST-BIG'`)).id;
  const small = (await one(`select id from "Tenant" where name='LOADTEST-T1'`)).id;
  const product = await one(`select id, "salePrice" from "Product" where "tenantId"=$1 and barcode='LTB1'`, [T]);
  const last = await one(`select id, "salePrice" from "Product" where "tenantId"=$1 and barcode='LTB-LAST'`, [T]);
  await db.query(`update "Product" set stock=1 where id=$1`, [last.id]); // reset for re-runs
  await db.query(`update "User" set "sessionsValidAfter"=null where email='owner@loadtest.invalid'`);

  const owner = jar();
  await owner.login('owner@loadtest.invalid');

  const sale = (productId, price, idemKey) => owner.req('POST', '/api/transactions', {
    items: [{ productId, quantity: 1, salePrice: price }],
    customerPhone: '9876543210', customerName: 'LT Race', paymentMethod: 'CASH', amountReceived: 100000,
  }, idemKey ? { 'idempotency-key': idemKey } : {});

  // 1. Same checkout retried 10x concurrently (double-click / network retry) → one sale.
  {
    const k = key();
    const before = Number((await one(`select stock from "Product" where id=$1`, [product.id])).stock);
    const res = await Promise.all(Array.from({ length: 10 }, () => sale(product.id, product.salePrice, k)));
    const ids = new Set(res.filter((r) => r.status === 201).map((r) => r.json.transaction.id));
    const rows = Number((await one(`select count(*) n from "Transaction" where "tenantId"=$1 and "idempotencyKey"=$2`, [T, k])).n);
    const after = Number((await one(`select stock from "Product" where id=$1`, [product.id])).stock);
    record('POS: 10 concurrent retries of one checkout', rows === 1 && ids.size === 1 && before - after === 1,
      `statuses=${[...new Set(res.map((r) => r.status))]} distinctIds=${ids.size} rowsWithKey=${rows} stockDelta=${before - after}`);
  }

  // 2. Ten cashiers sell the LAST unit simultaneously → exactly one succeeds, stock never < 0.
  {
    const res = await Promise.all(Array.from({ length: 10 }, () => sale(last.id, last.salePrice, key())));
    const ok = res.filter((r) => r.status === 201).length;
    const stock = Number((await one(`select stock from "Product" where id=$1`, [last.id])).stock);
    const errors = [...new Set(res.filter((r) => r.status !== 201).map((r) => `${r.status}:${r.json?.error || ''}`.slice(0, 60)))];
    record('POS: 10 concurrent sales of the last unit', ok === 1 && stock === 0, `succeeded=${ok} finalStock=${stock} others=${errors.join(' | ')}`);
  }

  // 3. Two cashiers edit the same invoice at the same time → one wins, one 409; stock consistent.
  {
    const created = await sale(product.id, product.salePrice, key());
    const id = created.json.transaction.id;
    const before = Number((await one(`select stock from "Product" where id=$1`, [product.id])).stock);
    const edit = (qty) => owner.req('PUT', `/api/transactions/${id}`, { items: [{ productId: product.id, quantity: qty, salePrice: product.salePrice }], reason: 'LT race' });
    const res = await Promise.all([edit(3), edit(5)]);
    const statuses = res.map((r) => r.status).sort();
    const tx = await one(`select "editCount" from "Transaction" where id=$1`, [id]);
    const qty = Number((await one(`select sum(quantity) q from "TransactionItem" where "transactionId"=$1`, [id])).q);
    const after = Number((await one(`select stock from "Product" where id=$1`, [product.id])).stock);
    // Invariant: stock moved by exactly (final qty - original qty of 1).
    record('Invoice: 2 concurrent edits of one invoice', statuses.join(',') === '200,409' && tx.editCount === 1 && before - after === qty - 1,
      `statuses=${statuses} editCount=${tx.editCount} finalQty=${qty} stockDelta=${before - after} (expected ${qty - 1})`);
  }

  // 4. Guest double-submits Place Order 8x with one idempotency key → one order.
  {
    const k = key();
    const guest = jar();
    const res = await Promise.all(Array.from({ length: 8 }, () => guest.req('POST', '/api/customer/orders', {
      tenantId: 'loadtest-big', items: [{ productId: product.id, quantity: 1 }], guestName: 'LT Guest', guestPhone: '9123456780',
    }, { 'idempotency-key': k })));
    const rows = Number((await one(`select count(*) n from "OrderRequest" where "tenantId"=$1 and "idempotencyKey"=$2`, [T, k])).n);
    record('Website: guest submits one order 8x concurrently', rows === 1, `statuses=${[...new Set(res.map((r) => r.status))]} ordersWithKey=${rows}`);
  }

  // 5. Kitchen: "Complete" clicked 6x concurrently on one READY order → exactly one invoice.
  {
    const o = await jar().req('POST', '/api/customer/orders', {
      tenantId: 'loadtest-big', items: [{ productId: product.id, quantity: 2 }], guestName: 'LT Kitchen', guestPhone: '9123456781',
    }, { 'idempotency-key': key() });
    const orderId = o.json.order.id;
    for (const action of ['ACCEPT', 'START_PREPARING', 'MARK_READY']) await owner.req('PATCH', `/api/tenant/orders/${orderId}`, { action });
    const res = await Promise.all(Array.from({ length: 6 }, () => owner.req('PATCH', `/api/tenant/orders/${orderId}`, { action: 'COMPLETE', paymentMethod: 'UPI' })));
    const order = await one(`select status, "transactionId" from "OrderRequest" where id=$1`, [orderId]);
    const invoices = Number((await one(`select count(*) n from "Transaction" where "tenantId"=$1 and notes like $2`, [T, `Online order #${orderId.slice(0, 8)}%`])).n);
    const payments = Number((await one(`select count(*) n from "TransactionPayment" where "transactionId"=$1`, [order.transactionId])).n);
    record('Kitchen: Complete clicked 6x concurrently', invoices === 1 && order.status === 'COMPLETED' && payments === 1,
      `statuses=${res.map((r) => r.status).sort()} invoices=${invoices} payments=${payments}`);
  }

  // 6. Order state race: Cancel vs Accept on the same pending order → exactly one applies.
  {
    const o = await jar().req('POST', '/api/customer/orders', {
      tenantId: 'loadtest-big', items: [{ productId: product.id, quantity: 1 }], guestName: 'LT State', guestPhone: '9123456782',
    }, { 'idempotency-key': key() });
    const orderId = o.json.order.id;
    const res = await Promise.all([
      owner.req('PATCH', `/api/tenant/orders/${orderId}`, { action: 'ACCEPT' }),
      owner.req('PATCH', `/api/tenant/orders/${orderId}`, { action: 'REJECT' }),
    ]);
    const ok = res.filter((r) => r.status === 200).length;
    const final = (await one(`select status from "OrderRequest" where id=$1`, [orderId])).status;
    record('Orders: concurrent Accept vs Reject', ok === 1 && ['ACCEPTED', 'REJECTED'].includes(final), `statuses=${res.map((r) => r.status).sort()} final=${final}`);
  }

  // 7. Tenant isolation: a logged-in owner of tenant A probing tenant B by id.
  {
    const bOrder = await one(`insert into "OrderRequest"(id,status,"tenantId","updatedAt") values (gen_random_uuid(),'PENDING',$1,now()) returning id`, [small]);
    const bCustomer = await one(`insert into "Customer"(id,name,phone,"tenantId") values (gen_random_uuid(),'Victim','8000000001',$1) returning id`, [small]);
    const bTx = await one(`select id from "Transaction" limit 0`).catch(() => null);
    const probes = [
      ['GET  /api/website/stats?tenantId=B', await owner.req('GET', `/api/website/stats?tenantId=${small}`), (r) => r.status === 403],
      ['PATCH /api/tenant/orders/<B order> ACCEPT', await owner.req('PATCH', `/api/tenant/orders/${bOrder.id}`, { action: 'ACCEPT' }), (r) => r.status === 404],
      ['DELETE /api/tenant/orders/<B order>', await owner.req('DELETE', `/api/tenant/orders/${bOrder.id}`), (r) => r.status === 404],
      ['GET  /customers/<B customer> page', await owner.req('GET', `/customers/${bCustomer.id}`), (r) => !r.text.includes('8000000001')],
      ['GET  /api/tenants/<B> (superadmin-only)', await owner.req('GET', `/api/tenants/${small}`), (r) => r.status === 401 || r.status === 403],
      ['PUT  /api/transactions/<random id>', await owner.req('PUT', `/api/transactions/${crypto.randomUUID()}`, { items: [{ productId: product.id, quantity: 1, salePrice: 1 }], reason: 'x' }), (r) => r.status === 404],
    ];
    void bTx;
    const stillPending = (await one(`select status from "OrderRequest" where id=$1`, [bOrder.id])).status === 'PENDING';
    for (const [label, res, ok] of probes) record(`Isolation: ${label}`, ok(res) && stillPending, `status=${res.status}`);
    await db.query(`delete from "OrderRequest" where id=$1`, [bOrder.id]);
    await db.query(`delete from "Customer" where id=$1`, [bCustomer.id]);
  }

  // 8. Session revocation: a live session dies once sessionsValidAfter is set (≤30s cache).
  {
    const before = await owner.req('GET', '/api/transactions/held');
    await db.query(`update "User" set "sessionsValidAfter"=now() where email='owner@loadtest.invalid'`);
    const t0 = Date.now();
    let after;
    do {
      await new Promise((r) => setTimeout(r, 2000));
      after = await owner.req('GET', '/api/transactions/held');
    } while (after.status === 200 && Date.now() - t0 < 40_000);
    const fresh = jar();
    await fresh.login('owner@loadtest.invalid');
    const relogin = await fresh.req('GET', '/api/transactions/held');
    record('Auth: revoked session is rejected; fresh login works', before.status === 200 && after.status === 401 && relogin.status === 200,
      `before=${before.status} afterRevocation=${after.status} (in ${Math.round((Date.now() - t0) / 1000)}s) relogin=${relogin.status}`);
    await db.query(`update "User" set "sessionsValidAfter"=null where email='owner@loadtest.invalid'`);
  }

  console.table(results);
  const failed = results.filter((r) => r.result === 'FAIL').length;
  console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
  await db.end();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(2); });
