// Mixed-workload HTTP load test against a RUNNING server + the load-test dataset (seed.cjs).
// No dependencies: Node's fetch + a closed-loop virtual-user model.
//
//   BASE_URL=http://localhost:3100 JWT_SECRET=<server's> node scripts/loadtest/load.cjs [stage...]
//   stages: normal (10 VUs) | peak (40 VUs) | stress (80 VUs) | spike (150 VUs); default: all four
//   LT_STAGE_SECONDS=30 per stage
//
// Workload mix (weights are per request, roughly a busy lunch hour across many cafes):
//   storefront page views (anonymous, random cafe)   35%
//   app: cafe menu (anonymous)                       25%
//   app: place order (logged-in customer, QR/app)    10%
//   POS checkout (staff, busy cafe)                  10%
//   kitchen queue poll (staff)                       12%
//   staff dashboard render (heavy)                    3%
//   health probe                                      5%
//
// Each virtual user sends its own X-Forwarded-For so per-IP rate limits see distinct clients
// (valid only because no proxy sits in front of the test server — see REPORTS.md caveats).
require('dotenv/config');
const { Client } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const STAGE_SECONDS = Number(process.env.LT_STAGE_SECONDS || 30);
const STAGES = { normal: 10, peak: 40, stress: 80, spike: 150 };
const PASSWORD = process.env.LT_PASSWORD || 'LoadTest#2026';
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET (the running server\'s) is required to mint customer tokens');

const pct = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))] : 0);

async function staffCookie() {
  const cookies = new Map();
  const store = (res) => { for (const c of res.headers.getSetCookie?.() || []) { const [pair] = c.split(';'); const i = pair.indexOf('='); cookies.set(pair.slice(0, i), pair.slice(i + 1)); } };
  const hdr = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  let r = await fetch(`${BASE}/api/auth/csrf`); store(r); const { csrfToken } = await r.json();
  r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: hdr() },
    body: new URLSearchParams({ csrfToken, email: 'owner@loadtest.invalid', password: PASSWORD, json: 'true' }).toString() });
  store(r);
  if (!hdr().includes('session-token')) throw new Error('staff login failed');
  return hdr();
}

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const T = (await db.query(`select id from "Tenant" where name='LOADTEST-BIG'`)).rows[0].id;
  const products = (await db.query(`select id, "salePrice" from "Product" where "tenantId"=$1 and barcode like 'LTB%' and barcode<>'LTB-LAST' limit 50`, [T])).rows;
  const accounts = (await db.query(`select id, email, "tokenVersion" from "CustomerAccount" where email like '%@loadtest.invalid'`)).rows;
  const tokens = accounts.map((a) => jwt.sign({ id: a.id, email: a.email, role: 'CUSTOMER', tokenVersion: a.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1h' }));
  const cookie = await staffCookie();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const slugs = ['loadtest-big', ...Array.from({ length: 200 }, (_, i) => `loadtest-t${i + 1}`)];

  const ops = [
    [35, 'storefront page', () => ({ url: `/site/${pick(slugs)}`, init: {} })],
    [25, 'app: cafe menu', () => ({ url: `/api/mobile/customer/store-menu?tenantId=${pick(slugs)}`, init: {} })],
    [10, 'app: place order', () => {
      const p = pick(products);
      return { url: '/api/mobile/customer/orders', init: { method: 'POST', headers: { authorization: `Bearer ${pick(tokens)}`, 'content-type': 'application/json' },
        body: JSON.stringify({ tenantId: 'loadtest-big', items: [{ productId: p.id, quantity: 1 }], idempotencyKey: crypto.randomUUID() }) } };
    }],
    [10, 'POS checkout', () => {
      const p = pick(products);
      return { url: '/api/transactions', init: { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ items: [{ productId: p.id, quantity: 1, salePrice: p.salePrice }], customerPhone: `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`, paymentMethod: 'CASH', amountReceived: 100000 }) } };
    }],
    [12, 'kitchen poll', () => ({ url: '/api/tenant/kitchen', init: { headers: { cookie } } })],
    [3, 'staff dashboard', () => ({ url: '/dashboard', init: { headers: { cookie } } })],
    [5, 'health', () => ({ url: '/api/health', init: {} })],
  ];
  const totalW = ops.reduce((s, o) => s + o[0], 0);
  const chooseOp = () => { let r = Math.random() * totalW; for (const o of ops) { if ((r -= o[0]) < 0) return o; } return ops[0]; };

  const stages = process.argv.slice(2).filter((s) => STAGES[s]);
  const summary = [];
  for (const stage of stages.length ? stages : Object.keys(STAGES)) {
    const vus = STAGES[stage];
    const stats = new Map();
    let maxDbConns = 0;
    const end = Date.now() + STAGE_SECONDS * 1000;
    const sampler = setInterval(async () => {
      try {
        const n = Number((await db.query(`select count(*) n from pg_stat_activity where datname=current_database() and state <> 'idle'`)).rows[0].n);
        maxDbConns = Math.max(maxDbConns, n);
      } catch { /* sampling is best-effort */ }
    }, 1000);

    const vu = async (i) => {
      const ip = `10.${(i >> 8) & 255}.${i & 255}.${Math.floor(Math.random() * 250)}`;
      while (Date.now() < end) {
        const [, name, build] = chooseOp();
        const { url, init } = build();
        const t0 = performance.now();
        let status = 0;
        try {
          const res = await fetch(BASE + url, { ...init, redirect: 'manual', headers: { ...(init.headers || {}), 'x-forwarded-for': ip }, signal: AbortSignal.timeout(30000) });
          await res.arrayBuffer();
          status = res.status;
        } catch { status = -1; }
        const ms = performance.now() - t0;
        if (!stats.has(name)) stats.set(name, { lat: [], codes: {} });
        const s = stats.get(name);
        s.lat.push(ms);
        s.codes[status] = (s.codes[status] || 0) + 1;
      }
    };
    const t0 = Date.now();
    await Promise.all(Array.from({ length: vus }, (_, i) => vu(i)));
    clearInterval(sampler);
    const secs = (Date.now() - t0) / 1000;

    const rows = [];
    let all = [], errors = 0, total = 0;
    for (const [name, s] of stats) {
      s.lat.sort((a, b) => a - b);
      all = all.concat(s.lat);
      const errs = Object.entries(s.codes).filter(([c]) => Number(c) >= 500 || Number(c) < 0 || c === '429').reduce((n, [, v]) => n + v, 0);
      errors += errs; total += s.lat.length;
      rows.push({ endpoint: name, reqs: s.lat.length, rps: +(s.lat.length / secs).toFixed(1), p50: Math.round(pct(s.lat, 50)), p95: Math.round(pct(s.lat, 95)), p99: Math.round(pct(s.lat, 99)), codes: JSON.stringify(s.codes) });
    }
    all.sort((a, b) => a - b);
    console.log(`\n=== stage ${stage}: ${vus} virtual users, ${secs.toFixed(0)}s ===`);
    console.table(rows);
    const line = { stage, vus, reqs: total, rps: +(total / secs).toFixed(1), p50: Math.round(pct(all, 50)), p95: Math.round(pct(all, 95)), p99: Math.round(pct(all, 99)), errorRate: `${((errors / Math.max(1, total)) * 100).toFixed(2)}%`, maxActiveDbConns: maxDbConns };
    console.log(line);
    summary.push(line);
  }
  console.log('\n=== SUMMARY ===');
  console.table(summary);
  await db.end();
})().catch((e) => { console.error(e); process.exit(1); });
