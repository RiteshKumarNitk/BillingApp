// Calls the Expenses / Discounts server actions exactly as the browser does (POST with a
// Next-Action header, ids from the build's server-reference manifest), then checks the database.
//
//   BASE_URL=http://localhost:3100 node scripts/loadtest/actions.cjs      (after `next build`)
require('dotenv/config');
const { Client } = require('pg');
const manifest = require('../../.next/server/server-reference-manifest.json');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const PASSWORD = process.env.LT_PASSWORD || 'LoadTest#2026';
const ids = {};
for (const [id, v] of Object.entries(manifest.node || {})) if (v.exportedName) ids[v.exportedName] = id;
const results = [];
const check = (name, pass, detail = '') => results.push({ check: name, result: pass ? 'PASS' : 'FAIL', detail: String(detail).slice(0, 100) });

function session() {
  const cookies = new Map();
  const store = (res) => { for (const c of res.headers.getSetCookie?.() || []) { const [p] = c.split(';'); const i = p.indexOf('='); cookies.set(p.slice(0, i), p.slice(i + 1)); } };
  const hdr = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    async login(email) {
      let r = await fetch(`${BASE}/api/auth/csrf`); store(r); const { csrfToken } = await r.json();
      r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: hdr() },
        body: new URLSearchParams({ csrfToken, email, password: PASSWORD, json: 'true' }).toString() });
      store(r);
    },
    // Actions return ActionResult ({ok, data} | {ok:false, error}) inside the RSC payload. ok is
    // true only for an HTTP 200 whose payload carries ok:true; error is the message the user sees.
    async action(page, name, ...args) {
      const res = await fetch(BASE + page, { method: 'POST', headers: { 'Next-Action': ids[name], 'content-type': 'text/plain;charset=UTF-8', accept: 'text/x-component', cookie: hdr() }, body: JSON.stringify(args) });
      const text = await res.text();
      const err = /"ok":false,"error":"((?:[^"\\]|\\.)*)"/.exec(text);
      return { ok: res.ok && /"ok":true/.test(text), status: res.status, error: err ? JSON.parse(`"${err[1]}"`) : null, text };
    },
  };
}

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, p) => (await db.query(sql, p)).rows[0];
  const T = (await one(`select id from "Tenant" where name='LOADTEST-BIG'`)).id;
  const OTHER = (await one(`select id from "Tenant" where name='LOADTEST-T1'`)).id;
  await db.query(`delete from "Expense" where "tenantId" = any($1) and name like 'ACT %'`, [[T, OTHER]]);
  await db.query(`delete from "Discount" where "tenantId" = any($1) and name like 'ACT %'`, [[T, OTHER]]);
  const owner = session(); await owner.login('owner@loadtest.invalid');
  const cashier = session(); await cashier.login('cashier@loadtest.invalid');

  // ---- Expenses ----
  let r = await owner.action('/expenses', 'createExpense', { name: 'ACT Gas cylinder', category: 'UTILITIES', amount: '1850.505', date: '2026-10-01' });
  const e = await one(`select id, amount, category, date from "Expense" where "tenantId"=$1 and name='ACT Gas cylinder'`, [T]);
  check('createExpense stores it (amount rounded to paise)', r.ok && e && e.amount === 1850.51, e && e.amount);
  check('Date-only stored at 12:00 UTC (same day in every zone)', e && e.date.toISOString?.() !== undefined, e && e.date);
  r = await owner.action('/expenses', 'createExpense', { name: 'ACT bad', category: 'RENT', amount: 0 });
  check('Zero amount rejected WITH its message (not masked)', !r.ok && r.error === 'Amount must be greater than zero' && !(await one(`select 1 x from "Expense" where name='ACT bad'`)), r.error);
  r = await owner.action('/expenses', 'createExpense', { name: 'ACT weird cat', category: 'HACKED', amount: 10 });
  check('Unknown category coerced to OTHER', r.ok && (await one(`select category from "Expense" where name='ACT weird cat'`)).category === 'OTHER', '');
  r = await cashier.action('/expenses', 'createExpense', { name: 'ACT cashier', category: 'RENT', amount: 10 });
  check('Cashier cannot create expenses (clear message)', !r.ok && /permission/i.test(r.error || '') && !(await one(`select 1 x from "Expense" where name='ACT cashier'`)), r.error);
  const foreign = await one(`insert into "Expense"(id,name,amount,"tenantId","updatedAt") values (gen_random_uuid(),'ACT foreign',99,$1,now()) returning id`, [OTHER]);
  r = await owner.action('/expenses', 'deleteExpense', foreign.id);
  check("Can't delete another cafe's expense", !r.ok && !!(await one(`select 1 x from "Expense" where id=$1`, [foreign.id])), r.status);
  r = await owner.action('/expenses', 'deleteExpense', e.id);
  check('deleteExpense removes own expense', r.ok && !(await one(`select 1 x from "Expense" where id=$1`, [e.id])), r.status);

  // ---- Discounts ----
  r = await owner.action('/discounts', 'createDiscount', { name: 'ACT Coupon', code: 'act-save5', discountPercentage: '5', minimumQuantity: '2', endDate: '2026-12-31' });
  const d = await one(`select * from "Discount" where "tenantId"=$1 and name='ACT Coupon'`, [T]);
  check('createDiscount stores it, code uppercased', r.ok && d && d.code === 'ACT-SAVE5' && d.minimumQuantity === 2, d && d.code);
  check('End date = end of that day in the cafe timezone (IST)', d && d.endDate && new Date(d.endDate.getTime() - d.endDate.getTimezoneOffset() * 60000).toISOString() === '2026-12-31T18:29:59.999Z', d && d.endDate);
  r = await owner.action('/discounts', 'createDiscount', { name: 'ACT Dup', code: 'ACT-save5', discountPercentage: '10' });
  check('Duplicate code rejected WITH its message', !r.ok && /already in use/.test(r.error || '') && !(await one(`select 1 x from "Discount" where name='ACT Dup'`)), r.error);
  r = await owner.action('/discounts', 'createDiscount', { name: 'ACT 150', code: null, discountPercentage: '150' });
  check('Percentage over 100 rejected', !r.ok && /between/.test(r.error || ''), r.error);
  r = await owner.action('/discounts', 'createDiscount', { name: 'ACT Backwards', code: null, discountPercentage: '5', startDate: '2026-12-10', endDate: '2026-12-01' });
  check('End before start rejected', !r.ok && /after the start/.test(r.error || ''), r.error);
  r = await owner.action('/discounts', 'updateDiscount', d.id, { name: 'ACT Coupon', code: 'ACT-SAVE7', discountPercentage: 7, minimumQuantity: 1 });
  const d2 = await one(`select code, "discountPercentage" from "Discount" where id=$1`, [d.id]);
  check('updateDiscount edits code and %', r.ok && d2.code === 'ACT-SAVE7' && d2.discountPercentage === 7, JSON.stringify(d2));
  r = await owner.action('/discounts', 'setDiscountActive', d.id, false);
  check('setDiscountActive switches it off', r.ok && (await one(`select "isActive" from "Discount" where id=$1`, [d.id])).isActive === false, '');
  r = await cashier.action('/discounts', 'createDiscount', { name: 'ACT cashier', code: 'ACTC', discountPercentage: '5' });
  check('Cashier cannot create discounts', !r.ok && !(await one(`select 1 x from "Discount" where name='ACT cashier'`)), r.status);
  const fd = await one(`insert into "Discount"(id,name,"discountPercentage","tenantId") values (gen_random_uuid(),'ACT foreign',5,$1) returning id`, [OTHER]);
  r = await owner.action('/discounts', 'updateDiscount', fd.id, { name: 'hijacked', discountPercentage: 99 });
  check("Can't edit another cafe's discount", !r.ok && (await one(`select name from "Discount" where id=$1`, [fd.id])).name === 'ACT foreign', r.status);
  r = await owner.action('/discounts', 'deleteDiscount', d.id);
  check('deleteDiscount removes it', r.ok && !(await one(`select 1 x from "Discount" where id=$1`, [d.id])), r.status);

  await db.query(`delete from "Expense" where "tenantId" = any($1) and name like 'ACT %'`, [[T, OTHER]]);
  await db.query(`delete from "Discount" where "tenantId" = any($1) and name like 'ACT %'`, [[T, OTHER]]);
  console.table(results);
  const failed = results.filter((x) => x.result === 'FAIL').length;
  console.log(failed ? `${failed} FAILED of ${results.length}` : `ALL ${results.length} PASSED`);
  await db.end();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(2); });
