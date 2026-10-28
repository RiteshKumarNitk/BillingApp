# Project Reports

Running log of code reviews, audits, and bug reports for this project. Each entry captures what
was found, what was fixed, and what's still open, so findings don't get lost between sessions.
Newest entries first. When adding a new report, keep the same structure: date, scope, findings
(with status), and a link to the relevant commits/PRs if applicable.

---

## 2026-10-28 — Tier 1 features (from the 10-26 gap analysis)

**Scope:** the six "backend exists, UI missing" features. No schema changes or migrations were
needed. Verified on a production build against the dev DB with the synthetic dataset (removed
afterwards): **41/41** feature checks (`scripts/loadtest/features.cjs`), **17/17** server-action
checks called exactly as the browser does (`scripts/loadtest/actions.cjs`), and the 13-scenario
concurrency/isolation suite re-run as a regression (13/13). 0 unhandled server errors.

| Feature | Where | Verified |
|---|---|---|
| **Expenses** | `/expenses` (sidebar → Insights, needs VIEW_PROFIT), `lib/actions/expenses.ts` | Add/delete, month navigation, per-category totals, paise rounding, unknown category → Other, Cashier denied, can't touch another cafe's expense |
| **Profit & Loss** | Reports page (VIEW_PROFIT only), `getProfitAndLoss` | Net sales and net profit match an independent SQL computation to the paisa (7,495 sales in the month) |
| **Discounts & Coupons admin** | `/discounts` (sidebar → Catalog, needs EDIT_PRODUCT), `lib/actions/discounts.ts` | Create/edit/toggle/delete; coupon vs automatic offer; case-insensitive duplicate codes rejected; dates are the cafe's calendar days; POS applies a created coupon and rejects an expired one |
| **CSV export** | `/api/export/{sales,gst,customers,expenses}`; buttons on Transactions, Customers, Expenses, P&L | Row counts and totals match the DB; streamed (30,004 customers); spreadsheet formula injection neutralised; customer export audit-logged; permission/validation/auth errors |
| **Guest order tracking** | `/track/[cafe]/[orderId]`, linked from the order confirmation | Live status + auto-refresh, first name only (no phone), noindex, real 404 for unknown/other-cafe/malformed ids |
| **Cancel order (app)** | `PATCH /api/mobile/customer/orders/[id]`, Flutter order detail, new Cancelled tab in Order Requests | Pending only; 409 with explanation once accepted; idempotent; other customers get 404; cancel racing Accept → exactly one wins |
| **Loyalty in the app** | `GET /api/mobile/customer/loyalty`, Flutter Profile → Loyalty Points | App balance = DB balance; rules served by the API |

**Bugs found and fixed while building these:**
- **Loyalty earn rate was inconsistent:** POS earned 1 point per ₹100, online orders 1 per ₹10 (10×).
  Now one source of truth (`lib/loyalty.ts`). Online completions also now record
  `loyaltyPointsEarned` on the sale (an invoice edit would otherwise have re-credited the points).
- **Server action error messages were masked in production** — the browser received only a digest,
  so "Amount must be greater than zero" became a generic error. New actions return
  `ActionResult` (`lib/actionResult.ts`); verified the real message reaches the client. **Every
  older action in the app (units, products, roles, tables, users, tenants…) still throws, so their
  validation messages are masked in production — open.**
- The legacy `/api/tenant/expenses` route had no permission check (any cashier could add/delete) —
  now VIEW_PROFIT.
- CSV money rounding used `Math.round(v*100)/100` (binary float) — 6 paise drift over a month; now
  decimal-correct (12 edge cases).
- Pages under `/site/[tenantId]` stream (that segment has `loading.tsx`), so `notFound()` there
  renders the 404 page with **HTTP 200** — why tracking lives at `/track/`.

**Not verified:** the Flutter changes (cancel button, loyalty screen, DI/route wiring) — no
Flutter SDK on this machine, so they are uncompiled and untested on a device. Run
`flutter analyze` and test on Android before release.

**Known limitations (by design, documented in the UI):** loyalty points are redeemed at the POS
counter only; customers can't cancel after the cafe accepts; GST export is a daily summary (sale
lines don't snapshot their GST rate, so no per-rate/HSN breakdown); P&L counts products without a
purchase price as zero cost.

---

## 2026-10-28 — Production readiness, scalability & reliability phase

**Scope:** No new features. Measure → find bottleneck → fix → re-measure, across security,
database, tenant isolation, ordering/billing integrity, auth, uploads, rate limiting, caching,
observability, health checks, backups, deployment, and load testing.

**How it was tested.** Node.js was available this session, so — unlike 2026-10-26 — everything
was built and run: `tsc` (clean), `next build` (clean, 0 warnings), and a production `next start`
against the **dev** Neon database (Postgres 17, `ap-southeast-1`; confirmed dev by the owner).
Large synthetic data was seeded with `scripts/loadtest/seed.cjs` (1,001 tenants; the busy cafe had
100k sales / 250k sale lines / 100k payments / 30k customers / 30k orders / 100k visits) and
removed afterwards with `cleanup.cjs` — the dev DB is back to its original 4 tenants / 8 sales.
All scripts are in `billing-web/scripts/loadtest/`; procedures in `billing-web/docs/PRODUCTION_RUNBOOK.md`.

**Important caveat on every latency/throughput number below:** the test machine is ~72 ms from
the database, and the app ran as a single local process. Absolute numbers are therefore a lower
bound, not production capacity. Relative before/after comparisons are valid.

### Critical findings fixed (all re-tested after the fix)

| # | Finding | Severity | Fix | Evidence after fix |
|---|---|---|---|---|
| 1 | **Storefront leaked private data to every visitor** — client-component props carried the raw tenant row (owner's Aadhaar document URL, GSTIN, subscription fields) and every product's purchase price, barcode, batch data | Critical | `lib/website/publicTenant.ts` projections at every `/site` boundary | HTML of home/shop/about/contact: 0 occurrences of the seeded Aadhaar URL, GSTIN, or `purchasePrice` |
| 2 | **Cross-tenant data access via server actions** — `listCustomers`, `getCustomerDetail`, `findOrCreateCustomerByPhone` were exported from a `"use server"` file and took `tenantId` as an argument (network-callable, no session check) | Critical | Moved to non-action `lib/customers.ts` | Not exported as actions any more (build) |
| 3 | **`/api/website/stats` returned any tenant's leads** (names/emails/phones/messages) to any logged-in user | High | Tenant from session; superadmin only for others | Concurrency suite: 403 for tenant B's id |
| 4 | **POS billing routes skipped session revocation** (`getToken` doesn't run the `jwt` callback) — deleted user / deactivated tenant / lapsed plan kept billing for 30 days | High | `lib/auth/staffSession.ts` (`getServerSession`) on all 5 routes | Revocation test: 401 within 29 s |
| 5 | **No way to revoke a stolen web session**; password resets didn't end existing sessions; customer password change didn't revoke app tokens | High | `User.sessionsValidAfter` (web + staff app), set on password reset; customer `tokenVersion` bump + fresh token returned to the device (Flutter updated to store it) | Revoked session → 401, fresh login → 200 |
| 6 | **Duplicate sales on double-click / retry** — POS checkout had no idempotency | Critical | `Transaction.idempotencyKey` + `@@unique([tenantId, idempotencyKey])`; both POS screens send a per-attempt key | 10 concurrent retries → 1 sale, stock −1 |
| 7 | **Duplicate guest orders** — order idempotency only worked for logged-in customers | High | `@@unique([tenantId, idempotencyKey])` on OrderRequest; website cart sends a key | 8 concurrent submits → 1 order, all 201 |
| 8 | **Double invoices from the kitchen** — "Complete" (and merchant APPROVE) checked state outside the transaction | Critical | Atomic compare-and-set claim inside the transaction (also for all order state transitions and kitchen ticket advance) | 6 concurrent Completes → 1 invoice, 1 payment, five 409s; Accept vs Reject → exactly one wins |
| 9 | **Concurrent invoice edits corrupted stock** (deltas computed from a stale read) | High | Optimistic concurrency on `editCount` | 2 concurrent edits → 200 + 409, stock delta exactly matches final quantity |
| 10 | **Lost writes under overload** — Prisma's 2 s transaction `maxWait` (< pool's 10 s) abandoned pending connections, leaving them "idle in transaction"; later writes on them never committed | Critical | `transactionOptions.maxWait` > pool connect timeout (`lib/prisma.ts`) | 40-sale burst ×3: idle-in-transaction 3/1 → 0/0/0, FK violations 8 → 0, successful sales 4–5 → 22–23 of 40 |
| 11 | **Order placement 500s** — customer find-or-create race, and *deterministic* failure when the phone already belonged to another customer row (e.g. a POS walk-in) | High | P2002 fallback to the existing row (not linked to the account — phone is unverified) | Guest duplicates all 201; 0 errors in server log |
| 12 | **Kitchen screen stalled the instance** — returned every active ticket (3.4 MB, 18–35 s per poll with a backlog) | High | Oldest 150 per source + field selection + "N more waiting" banner | 93 KB, 270–590 ms |
| 13 | **Dashboard queries scaled with the whole platform** — planner drove from the global `TransactionItem` table (250k seq scan + 250k PK probes, 576 ms) | High | Tenant-window-driven `LATERAL … OFFSET 0` plans; product-mix widgets windowed to 90 days (labelled) | Category 576 → 110 ms; cost now proportional to the tenant's window only |
| 14 | **POS rejected valid mobiles starting with 91** (`normalizePhone` stripped "91" unconditionally) | High | Strip the country code only when 10 valid digits remain | 12/12 unit cases; `9123456789` → 201 |
| 15 | **Migration history never baselined in the DB** — `migrate deploy` would have failed on any existing database | High | `migrate resolve --applied 0_baseline…` after proving zero drift; procedure in runbook §3.1 | Dev DB: 0 drift, all 7 checksums match |
| 16 | Upload route trusted the client MIME type, buffered unbounded bodies, accepted customer sessions, echoed provider errors | High | Magic-byte sniffing, Content-Length pre-check, staff-only + per-user rate limit, per-tenant folder, ≤2000 px, CDN `f_auto,q_auto`, generic error | HTML-as-PNG / SVG / EXE-as-JPEG → 400; 6 MB → 413; anonymous → 401 |
| 17 | Customers, Reports, and Transactions pages ignored search/pagination/date filters (`searchParams` read synchronously — a Promise in Next 15+) | Medium | `await searchParams` | Build + typecheck |
| 18 | Cron jobs unreachable (fixed 10-26) now share `lib/cronAuth.ts`; production requires `CRON_SECRET` | — | — | No secret → 401; with secret → 200 |

**Also added:** structured JSON logging with redaction (`lib/logger.ts`; verified no secrets in
output), `onRequestError` + process crash hooks (`instrumentation.ts`), production env validation
that refuses placeholder secrets (verified: instance refused to serve with the `.env` placeholders),
`/api/health` (app/DB/pool + configured dependencies; verified 200, and 503 under saturation),
security headers on every response (verified), CORS removed from cookie-auth APIs, 503 +
`Retry-After` (instead of 500) when the DB pool is saturated, a short-TTL public cache for
storefront + app menu with stampede protection, per-account order rate limits, a batched
retention cron for website visits / read notifications, indexes from EXPLAIN (trigram customer
search, kitchen poll, audit log, customer sort, tenant slug), and the production runbook.

### Measurements

**Query plans** (busy cafe, 100k sales; `scripts/loadtest/explain.cjs`): 31 hot query shapes;
after fixes, all list/detail/POS/kitchen/app queries < 10 ms except tenant-wide counts and
all-time aggregates (see risks). Customers search 8 ms → 0.7 ms (trigram), kitchen poll 11.5 → 0.3 ms,
audit log 8.7 → 0.1 ms.

**Unloaded latency, warm** (72 ms DB round trip): storefront 355–630 → 12–22 ms; app menu
700–1150 → 3–7 ms (cache hits); kitchen poll 18–35 s → 0.27–0.59 s; staff dashboard ~1.7 s
(≈23 sequential queries × 72 ms — expected ~100–200 ms in-region).

**Load test** (`scripts/loadtest/load.cjs`, mixed workload: storefront 35%, app menu 25%, app
orders 10%, POS 10%, kitchen 12%, dashboard 3%, health 5%):

| Config | Stage (users) | Throughput | p50 | p95 | p99 | Errors |
|---|---|---|---|---|---|---|
| Before (pool 5) | normal (10) | 7.2 req/s | 747 ms | 4.4 s | 5.0 s | 0% |
| Before (pool 5) | stress (80) | 7.8 req/s | 4.4 s | 27 s | 30 s | 9.8% |
| Before (pool 5) | spike (150) | 8.5 req/s | 8.9 s | 30 s | 30 s | 22% |
| **Final (pool 20)** | normal (10) | 11.3 req/s | 541 ms | 2.7 s | 3.7 s | **0%** |
| **Final (pool 20)** | peak (40) | 27.7 req/s | 604 ms | 5.1 s | 6.0 s | **0%** |
| **Final (pool 20)** | stress (80) | 25.6 req/s | 1.2 s | 9.9 s | 10.9 s | **0%** |
| **Final (pool 20)** | spike (150) | 29.7 req/s | 2.2 s | 14.4 s | 16.7 s | **0%** |

First bottleneck identified: **DB connection pool × per-query network latency** (flat throughput
regardless of users, P2028 "unable to start a transaction"). Fixed by the transaction-option fix
and pool sizing; the remaining ceiling (~30 req/s here) is still round-trip-bound. Post-test
integrity check over all data the tests created: 0 negative stock, 0 orphaned sales/orders, 0
duplicate idempotency keys, 0 double-invoiced orders, 0 sales without lines, 0 idle-in-transaction.

**"999,999 users":** not claimed. What was shown: correctness holds under contention and overload
(no duplicates, no oversell, no lost writes), and throughput scales with pool size. What was not
shown: production-region capacity. With realistic concurrency (a few percent of users active at
peak), the deciding factors are in-region deployment, instance count × pool size, and Neon compute
size — all of which need the staging run in runbook §8.

### PRODUCTION READINESS GATE

| Area | Verdict | Basis |
|---|---|---|
| **Security** | **PASS** (code) / NOT VERIFIED (prod config) | Findings 1–5, 16 fixed and tested; secrets validated at boot; headers live. Prod secrets/headers behind a real proxy not seen. |
| **Database** | **PASS** (dev) / NOT VERIFIED (prod) | Plans measured at 100k-sale scale; indexes added; zero drift; checksums match. Production baseline step (runbook §3.1) not performed. |
| **API** | **PASS** | Auth on every route audited; idempotency; 409/503 semantics; 0 unhandled errors across all test runs. Remaining lint debt is style (`any`). |
| **Multi-tenant isolation** | **PASS** | Every id-addressed write audited; 2 holes fixed (findings 2, 3); 6 cross-tenant probes all denied. |
| **Authentication** | **PASS** | Revocation (web + both apps), password-change revocation, throttling, no fallback secrets. Token lifetimes unchanged (30 days, now revocable). |
| **Billing** | **PASS** (POS/invoices) / NOT VERIFIED (Razorpay live) | Idempotent checkout, edit concurrency, webhook dedupe (2026-08). Razorpay never exercised with real keys. |
| **Ordering** | **PASS** | Duplicate submits, Complete races, state races all tested. |
| **Inventory** | **PASS** | Last-unit race: 1 of 10 succeeds, stock 0; DB `CHECK (stock >= 0)` verified present. Online orders don't reserve stock (by design) — the second buyer fails at completion with 409. |
| **Web** | **PASS** with notes | Build clean; storefront cached + leak-free; shop page is 642 KB for a 300-item menu (images/markup not optimized — `<img>` used throughout). |
| **Mobile (Flutter)** | **NOT VERIFIED** | No Flutter SDK here: the 2 Dart edits (token rotation on password change) were not compiled; no device testing; "My Orders" still shows newest 50 only. |
| **Performance** | **PASS** (fixes) / NOT VERIFIED (prod capacity) | All before/after numbers above. |
| **Monitoring** | **FAIL** | Logging, crash hooks, and health are in place and verified, but no log drain, alerting, or uptime monitor is configured anywhere. |
| **Backup & Recovery** | **FAIL** | Procedure written (runbook §5); Neon PITR retention, access, and a restore drill are unverified; no off-platform backup exists. |
| **Deployment** | **FAIL** | No CI pipeline, no scheduler for the 3 cron jobs, production baseline step pending, line-ending/checksum policy undecided. Rollback procedure documented. |
| **Load Testing** | **PASS** (method, dev) / NOT VERIFIED (prod-like) | Repeatable suite exists and ran clean (0% errors at 150 users); needs a run in-region against staging. |

**Verdict: not production-ready yet.** The application code passed every integrity, isolation,
and load test run this session, but three operational gates fail (monitoring, backup/recovery,
deployment) and those are exactly what decides whether an incident is survivable. None of them
needs new code.

### Remaining risks (open)

- Tenant-wide counts and all-time aggregates (dashboard total sales, transactions page count, Reports
  "Top Customers by Spend") still scan the tenant's full history (18–93 ms at 100k sales, linear).
  Fine for years of a single cafe; revisit with summary tables if a tenant reaches millions of sales.
- In-process rate limiter and public cache are per instance (limits multiply by instance count;
  cache staleness ≤ 30 s across instances). A shared store (Redis) is the fix if that matters.
- FK violations seen under overload were fixed by finding 10, but the exact Prisma/adapter mechanism
  was inferred from evidence (idle-in-transaction connections + FK failures disappearing), not traced
  in the Prisma source.
- Money is still `Float` (M10).
- Server-side `statement_timeout` can't be set through the Neon pooler (verified); app-side
  timeouts bound waits, not server work.
- Lint: 446 pre-existing errors (style, mostly `any`); all files created this session are clean.

---

## 2026-10-26 — Feature gap analysis + RC-1 backlog fix pass

**Scope:** (1) Whole-project review of billing-web (Next.js admin + public sites + API) and
cafeos-app (Flutter customer app) for **missing features**, and (2) a fix pass over every item
still open in the 2026-08-04 RC-1 audit below (M8–M10, U1–U7, P1–P4, S1–S8, D1–D7, B1–B6).

**⚠️ Verification caveat:** this session's machine had no Node.js, no `node_modules`, and no
Flutter SDK, so **nothing was built, linted, or run**. Every change was reviewed by reading the
code only. Before merging:
`cd billing-web && npm install && npx prisma migrate deploy && npm run build && npm run lint`,
then smoke-test: web login (staff + customer), Dashboard + Reports, Kitchen Queue → complete an
online order, Tables QR download, Settings as a Manager, and tenant signup.

### Deploy notes

- **Three new migrations**: `20261026120000_discount_code_per_tenant` (D6),
  `20261026120100_transaction_item_indexes` (P2/D1) — both non-destructive — and
  `20261026130000_drop_tenant_db_connection_string` (S5), which **drops a column**. It only ever
  held placeholders, but take a DB backup/snapshot before `migrate deploy` as usual.
- **`CRON_SECRET` is now required in production** — without it every `/api/cron/*` call is
  refused. Schedulers may send it as `Authorization: Bearer <secret>` (Vercel Cron) or `?secret=`.
- Optional new env var `MOBILE_API_CORS_ORIGIN` (S6). Unset = previous behavior (`*`).
- Kitchen Queue behavior change: completing an **online** order now asks Cash / UPI / Card (B1).

### Fixed this session (from the RC-1 backlog)

| # | Fix |
|---|---|
| M8 | New `lib/tenantTime.ts` (Intl-based, no new dependency): today/yesterday/this-month/this-year boundaries in `lib/analytics.ts` now use `Tenant.timezone`; SQL day buckets and peak hours use `("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE <tz>` (peak-hours chart was 5.5h off for IST tenants on a UTC server). Monthly transaction quota (`checkFeatureLimit`) uses the tenant month too. Chart date labels read UTC parts of Postgres `DATE` values so they no longer shift a day on servers west of UTC |
| M9 | `PATCH /api/tenants/[id]` whitelists the same fields PUT accepts, validates `status`, and bumps `Tenant.version` on status change (PUT/DELETE now do too) |
| U1 | ESLint ignores `scripts/**`, `prisma/seed.*`, `generated/**`; removed the unused `NextAuth` import in `types/next-auth.d.ts` |
| U2 | "Pending approval" option in the Tenants status filter (the page already honored `?status=`) |
| U3 | Website order confirmation now shows the order number (same 8-char ref staff see) and total, and stays until dismissed; logged-in customers get a "My Orders" link. (A full guest order-tracking page is listed under feature gaps.) |
| U4 | `getTenantUsers` requires `MANAGE_USERS` for tenant users |
| U5 | Tables + Website Builder QR codes render locally with `qrcode.react` (already a dependency). Also fixes "Download HD Image", which never downloaded — browsers ignore `download` on cross-origin links |
| U6 | Already resolved — the Team section has no carousel buttons any more. Related dead button fixed instead: the website **Reservation** section's "Make Reservation" did nothing; it now opens the site's Contact page (lead form), or dials the cafe, or is hidden |
| U7 | Settings shows a read-only notice and disables Save for users without `MANAGE_USERS` |
| P1 | NextAuth `jwt` callback re-validation (user + tenant + subscription) is cached per user for 30s; role/user/tenant-status/password changes call `clearSessionStateCache()` so they still apply immediately in-process. Trade-off: other instances see revocations within 30s |
| P2 | `getProfitTrendData` aggregates cost only over this tenant's in-window transactions (was: whole `TransactionItem` table). Added the missing `TransactionItem(transactionId)` / `(productId)` indexes |
| P3 | (Partial) `getClientIp` uses the right-most `X-Forwarded-For` hop (the one our edge proxy appends), so clients can no longer rotate spoofed IPs past every limiter. Shared store still deferred (see below) |
| S1 | Auth endpoints were already throttled in the last commit (never marked); added the two missing ones: NextAuth web login (staff + customer providers, per-IP and per-email) and `/api/register` (5/hour/IP, plus email validation + normalization). Customer web login and `customer/auth/register` duplicate check are now case-insensitive |
| S2 | Already fixed by H2/H3 (2026-08-04) |
| S3 | Checkout/cancel already guarded by `assertRazorpayConfigured()`; the remaining hole was the **sandbox checkout simulator page**, which was reachable with real keys/in production and **loaded any tenant's subscription by id (IDOR)**. Now 404s outside dev simulation mode and checks tenant ownership. Also fixed the simulator 404ing on the mock Razorpay subscription id |
| S4 | `AGENTS.md` no longer tells agents to read `node_modules/next/dist/docs/` as instructions |
| S6 | `/api/mobile/*` CORS origin configurable via `MOBILE_API_CORS_ORIGIN` (default unchanged) |
| S7 | `SessionSync` no longer writes the session/tenant profile to localStorage (nothing read it); it now clears copies older builds left behind |
| S8 | No change needed — `Discount` has no redemption cap, so there's no check-then-apply race. Per-coupon usage caps are a feature gap (below) |
| D2 | Already resolved by the `0_baseline_current_schema` rebaseline (old history in `prisma/migrations_archive/`) |
| D3 | Dunning writes `UNPAID` (the documented "access blocked" status) instead of `SUSPENDED` — which also lets `markInvoiceAsPaid` reactivate it (it never matched `SUSPENDED`) |
| D4/B2 | Online orders are taxed per product (`gstRate`/`gstInclusive`, same rule as the Cafe POS), with the order discount spread proportionally; `Shop.defaultTaxRate` remains only as the fallback for tenants that never set per-product GST. Amounts rounded to paise |
| D5 | `OrderRequest.status` schema comment documents `ON_HOLD` and the real lifecycle |
| D6 | `Discount.code` is unique **per tenant** (`@@unique([tenantId, code])`) instead of globally; APIs reject case-insensitive duplicates with 409. `Customer.email` non-unique is intended (phone is the customer key) |
| D7 | Web delete already handled it; mobile `DELETE /api/mobile/products/[id]` now returns the same clear 409 instead of a 500 on FK violation |
| B1 | Kitchen "Complete" for online orders records the payment method (Cash/UPI/Card) on the Transaction **and** a `TransactionPayment` row, so payment reports include online revenue. Mobile merchant APPROVE accepts an optional `paymentMethod` |
| B3 | Labels now match the data: "Sales — last 7 days" (rolling) with "this month / this year" (calendar, tenant TZ); "GST Last 7 Days" |
| B4 | Removed the phantom `VIEW_PRODUCT` from the Cashier role defaults (existing DB rows are harmless — the role editor already strips unknown permissions on save) |
| B5 | Invoice-edit "same day" rule uses the tenant's calendar day (service + both invoice pages) |
| B6 | Self-serve signup emails every superadmin ("New signup awaiting approval" → `/tenants?status=PENDING`) |
| S5 | Dropped `Tenant.dbConnectionString` (schema + migration) and removed its placeholder writes from signup, `createTenant`, and the seed/maintenance scripts |
| P4 | Order Requests: cursor pagination (`limit`/`cursor` → `nextCursor`, 50 per page) with a "Load older orders" button — the 15s poll no longer replaces pages the user loaded. Mobile customer orders API: same optional cursor (backward compatible). App menu: the 200-item cap that silently hid items is now a 1000-item safety ceiling with a server warning |

### New bugs found and fixed during the pass

- **Cron jobs never ran**: `/api/cron/*` wasn't in the middleware allowlist, so the scheduler
  (no session cookie) got 401 before the route — same failure mode M1 found for the webhook.
  Allowlisted; both crons now share `lib/cronAuth.ts`.
- **POS coupon codes could never be created**: neither discount API wrote `Discount.code`, so the
  POS coupon field could never match anything. Both create/update now accept `code`.
- **Online sales showed 100% margin**: kitchen COMPLETE / merchant APPROVE wrote every line with
  `purchasePrice: 0`. Now snapshots the product's real cost.
- **Online-order discount dropped from the invoice**: recorded as `couponDiscountAmount` now.
- `PUT /api/tenants/[id]` password reset didn't bump the admin's `tokenVersion`.

### Deferred (needs a decision or infrastructure)

- **M10** (money as `Float`): needs a `Decimal`/integer-paise migration across schema + every
  money path, and a unit-test suite for `lib/services/transactions.ts` first. Online-order totals
  are now rounded to paise as a stopgap.
- **P3** shared rate-limit store (Redis/Upstash) — only matters once running multi-instance.
- **P4 (remaining part)**: case-insensitive `contains` searches (tenants, products, customers)
  still can't use an index; fixing that needs the `pg_trgm` extension + GIN indexes (Prisma's
  `postgresqlExtensions` preview feature), best done once a DB is available to verify drift.
- **cafeos-app** "My Orders" doesn't page yet — the API now returns `nextCursor`; the app still
  shows the newest 50.
- Auto-refill cron still resets all tenants at one fixed time (not per-tenant midnight).

### Feature gap analysis

**Biggest gaps**
1. **No staff/merchant mobile app.** `mobile-app/` was deleted (`953801c`) but ~17 staff routes
   under `/api/mobile/*` remain with no client. Decide: rebuild in Flutter, or make the web POS a PWA.
2. **No online payment for customers** (app + website). Orders are pay-at-counter only; Razorpay is
   wired for SaaS subscriptions only.
3. **Push notifications half-built.** Server FCM sender + `fcm-token` endpoint exist; the Flutter
   app has no Firebase ("push delivery is coming soon").
4. **No void / refund / sales return.** Completed bills can only be edited.
5. **Delivery not implemented** — `DELIVERY` order type and saved addresses exist, no flow.

**Backend exists, no UI**
- Expenses (`/api/tenant/expenses`) — no page; not in profit reports.
- Discounts/coupons — only creatable via the (deleted) staff app's API; no web admin page.
- Employees (`Employee` model, sales targets) — no UI; overlaps with `User`.
- Marketing leads (`MarketingLead`) — superadmin can't view them.
- No store-side notification inbox (only a sound alert in the order queue).
- Customer-entered coupon codes at online checkout.

**Web admin**
- POS: shift open/close + cash drawer + day-end Z report; credit sales / customer dues (khata);
  thermal ESC/POS + KOT printing; PDF invoices; WhatsApp/SMS/email invoice sharing; offline mode.
- Inventory: suppliers, purchase orders, goods received; stock-adjustment log (wastage/damage);
  recipe/ingredient deduction; batch expiry alerts.
- Reports: CSV/Excel/PDF export (none anywhere); P&L with expenses; item/category/staff/hour/
  payment-mode reports; GSTR-1/3B + HSN summary; custom date ranges.
- Restaurant ops: table status board, merge/split tables, split bill, waiter ordering from phone,
  modify/cancel after acceptance; table reservations (website button now routes to Contact).
- Platform: multi-outlet per tenant; staff password reset + email verification + 2FA; guest order
  tracking page; i18n (Hindi/regional); per-coupon usage caps.

**Customer app (cafeos-app)**
- Online payment / pay-at-table; cancel order; ratings & reviews ("coming soon"); live order
  tracking; loyalty balance + redemption (backend has loyalty, app shows none); coupons at
  checkout; delivery ordering; social/OTP login; receipt download; deep links from QR; reservations.

**Engineering**
- No tests (only the default Flutter widget test and iOS/macOS Runner stubs); no CI/CD; the
  `billing-web/README.md` is create-next-app boilerplate and contains plaintext admin credentials.
- Kitchen/order queues poll instead of using WebSockets/SSE.

---

## 2026-08-04 — RC-1 Release-Candidate end-to-end audit (no code written)

**Scope:** Feature-freeze pass over the entire CafeOS platform (billing-web Next.js app + cafeos-app
Flutter app), as requested. Verified complete workflows, every module, API integration, database,
mobile app, website, performance, security, and business logic. No implementation was done — this
is a report only, awaiting approval.

**What was verified as working (baseline):**
- `next build` (production) succeeds cleanly. `flutter analyze` — zero issues.
- Super Admin flow verified live in a browser (login → dashboard → Tenants list renders with
  statuses; zero console errors).
- Public customer registration (`/api/customer/auth/register`), guest order submission
  (reaches validation), tenant-site pages, `/api/mobile/customer/*` public routes, lead/visit
  rate-limiting, and webhook signature verification all work.
- The transactions engine (`lib/services/transactions.ts`) has solid server-side guards: catalog
  price checks (OVERRIDE_PRICE), tenant-scoped product ownership, atomic stock checks, loyalty
  redemption races, and quota re-check inside the transaction.
- Order idempotency via `idempotencyKey`; held-bill resume is atomic.

### Fixed this session — approved RC-1 implementation (2026-08-04)

All Critical + High findings (C1, C2, H1–H5) were implemented and verified, followed by the
approved Medium batches (M1, M3, M5, M6, M7 and M2, M4). Each finding below carries a **Fixed**
marker with notes.

**Medium batch (M1, M3, M5, M6, M7):**

| # | Fix | Verification |
|---|---|---|
| M1 | `subscription.charged` webhook dedupes on `razorpayPaymentId`/`razorpayOrderId` (findFirst guard + re-check inside a `$transaction`) so Razorpay retries can't mint duplicate PAID invoices. **Also fixed a blocker that made the whole webhook dead**: `/api/webhooks/razorpay` was never in the middleware allowlist, so Razorpay's signature-authenticated server-to-server calls got `401 Unauthorized` from the middleware before reaching the route. Allowlisted. Code-review follow-ups applied: dedupe filter is skipped (never `OR: []`) when neither payment nor order id exists, and an S3 guard now refuses to process webhooks in simulation mode under `NODE_ENV=production` (the allowlist would otherwise have made the simulation-mode hole exploitable). | Live: unauthenticated POST now reaches the route (200 "no tenantId, ignored", was 401); bogus payload is non-mutating; no 500 on the id-less edge payload |
| M3 | `buildTransactionPlan` single-payment path now rejects `amountReceived < netAmount - 0.01` with a 400 and recomputes `changeAmount` server-side instead of trusting the client (mirrors the split-payments guard) | Build + code review; POS always sends `amountReceived` (defaults to netAmount), so no caller regression |
| M5 | All low-stock queries now compare against each product's `minStockThreshold` (Prisma field reference) instead of hardcoded `<= 10`: `getLowStockItems`, `getOverviewCounts` (analytics.ts), `getFilteredProducts` lowStock filter (products.ts), mobile `/api/mobile/products?lowStock=true` | Verified directly against the DB: field-reference query executes and matches the manual `stock <= minStockThreshold` filter exactly |
| M6 | `createTenant` now runs tenant + workspace defaults + subscription + invoice + coupon + roles + owner user inside ONE `prisma.$transaction` (bcrypt hashed up front outside the tx) — a mid-way failure rolls everything back instead of orphaning a tenant with no login. After commit, sends the owner a welcome email with login URL + credentials via `lib/mail.ts` (`EmailTemplates.OwnerWelcome`); mailer failure logs and continues. All interpolated values in the template are HTML-escaped. | Build + code review; both onboarding helpers already accepted a `Prisma.TransactionClient`, so they slot into the tx unchanged |
| M7 | `/robots.txt` + `/sitemap.xml` allowlisted in `middleware.ts` | Live: both now return 200 with real content (was 307 → login for robots.txt); `/dashboard` still redirects |

**Medium batch 2 (M2, M4):**

| # | Fix | Verification |
|---|---|---|
| M2 | Coupon redemptions are now counted at payment-confirmed time, not checkout-session creation: `createCheckoutSession` no longer increments `Coupon.redemptions` (abandoned/retried checkouts can't burn the cap), and a supplied-but-invalid coupon now throws instead of silently applying no discount. The applied coupon code rides in the Razorpay subscription notes (`notes.couponCode`); the `subscription.charged` webhook re-validates the coupon and increments `redemptions` inside the same dedupe-protected `$transaction` that mints the PAID invoice — once per subscription (renewal charges don't re-consume it) — and records `couponId` + recomputed `discountAmount`/`netAmount` on the invoice | Live (simulation webhook, throwaway tenant/coupon, cleaned up): first charge → invoice ₹100→₹90 with couponId, redemptions 0→1; duplicate webhook retry → no second invoice, still 1; renewal charge → second full-price invoice, redemptions still 1 |
| M4 | `editTransaction` now keys old/new lines by `productId::variantId::batchId::serialId` and routes stock reconciliation by product type: BATCH lines credit/debit `ProductBatch.stock` (same `gte` guard as a fresh sale), SERIAL lines flip `ProductSerial.status` SOLD↔AVAILABLE, VARIANT/SIMPLE paths unchanged. `EditTransactionItemInput` gained `batchId`/`serialId` (persisted on rewritten lines); a BATCH/SERIAL line without its ref is rejected 400 instead of silently adjusting base `Product.stock`. Edit UI carries the refs through and blocks adding BATCH/SERIAL products (that editor has no batch/serial picker) | Live (minted NextAuth session, disposable data, cleaned up): removing a BATCH line → batch stock 8→10 while base product stock stayed 0 (was the bug: base stock was being credited); adding one → 10→9 with batchId persisted; missing batchId → 400 |

**Critical + High batch (C1, C2, H1–H5):**

| # | Fix | Verification |
|---|---|---|
| C1 | Allowlisted `/api/register` in `middleware.ts` | Live: `POST /api/register` now reaches the route (400 validation, not 401) in dev AND a production `next start` build |
| C2 | `createCustomerOrder()` now rejects unavailable items (400), out-of-range quantities (400, cap 10,000), unresolvable variant ids (400), and over-stock quantities (409); kitchen `COMPLETE` (web) and merchant `APPROVE` (mobile) now respect `inventoryMode` (skip `ALWAYS_AVAILABLE`/`SERVICE`/`COMBO`) and throw a 409 inside the transaction on insufficient stock (whole sale rolls back). Stock decrement at COMPLETE/APPROVE uses the same atomic `updateMany({ stock: { gte } })` guard as the POS path, so concurrent completions can't oversell. Stock-track rule lives in one shared helper `lib/products/availability.ts` → `productTracksStock()` | Live: 100× order of a stock-3 item → 409; qty 0 → 400; qty 20,000 → 400; bogus variantId → 400 |
| H1 | `cancelSubscription`/`createCheckoutSession`/`applyCoupon` (subscription.ts) and `calculateProration`/`changeSubscriptionPlan` (proration.ts) now require role `ADMIN` or `SUPERADMIN`; proration actions also refuse a `tenantId` other than the caller's own tenant | Build + code review; tenant-scope check added for arbitrary-tenantId abuse |
| H2 | Staff mobile JWT now carries `tokenVersion`; `getMobileUserFromAuthHeader` is async and re-validates the user row + tokenVersion on every request (mirrors customer-mobile.ts). All 17 `/api/mobile/*` + merchant routes updated to `await` it | Live: fresh token → 200; after `tokenVersion` bump → 401; login again → works (state restored after test) |
| H3 | `/api/mobile/auth/login` now blocks non-ACTIVE tenants (403) and tenants without an active subscription (403), matching web login | Code review (no inactive-tenant account available to test live) |
| H4 | Added `EDIT_TRANSACTION` + `REOPEN_OLD_TRANSACTION` to `DEFAULT_ROLE_DEFINITIONS` Owner; new idempotent backfill script `scripts/backfill-owner-permissions.js` | Backfill ran: 3/3 existing Owner roles updated (additive) |
| H5 | Moved the missing-tenant check into `app/site/[tenantId]/layout.tsx` (`notFound()` in both `generateMetadata` and the body) so every `/site/[tenantId]/*` route 404s for a nonexistent tenant | Live: `/site/<nope>` and `/site/<nope>/about` → 404 in dev AND prod build; real tenant routes still 200 |

`next build` passes with all changes. ESLint on the changed files shows only the project's
pre-existing `no-explicit-any` debt (no new findings introduced).

Code-review follow-ups applied (2026-08-04): atomic stock decrement at COMPLETE/APPROVE,
quantity upper-bound, unresolvable-variant rejection, and a shared `productTracksStock()` helper.
Documented decisions (no change): staff mobile tokens issued *before* this deploy lack the
`tokenVersion` claim and remain valid until expiry (all new logins carry it, so revocation works
from this deploy forward); the subscription/billing role gate uses the app's established
`role === 'ADMIN'` owner convention (same as the website-builder gate), consistent with how every
tenant owner is created.

---

### CRITICAL BUGS

**C1. Public tenant registration is completely broken — `POST /api/register` returns 401.** — **FIXED 2026-08-04**
- **Description:** `middleware.ts`'s allowlist covers `/api/auth`, `/api/mobile`, `/api/customer`,
  `/api/marketing`, `/api/website/{lead,visit,table}` — but NOT `/api/register`. The middleware
  matcher intercepts `/api/register`, sees no token, and returns `401 {"error":"Unauthorized"}`
  before the route handler ever runs.
- **Steps to Reproduce:** Open `/auth/register`, fill the form, submit. (Confirmed live: curl
  `POST /api/register` with any body returns `401 {"error":"Unauthorized"}`. The page itself
  loads 200.)
- **Expected:** 201 with a new PENDING tenant + owner user (or 400/409 for invalid input).
- **Actual:** 401 for every submission — the whole self-serve signup funnel (and the "Super Admin
  → Create Subscription → Create Tenant → Owner Receives Login" path for self-registered
  tenants) is dead.
- **Recommended Fix:** Add `pathname.startsWith('/api/register')` to the middleware allowlist.
- **Priority:** Critical (blocks the primary acquisition workflow).

**C2. Online ordering has no server-side stock/availability validation.** — **FIXED 2026-08-04**
- **Description:** `createCustomerOrder()` (shared by website + mobile checkout) never checks
  `product.isAvailable`, `product.stock`, or `inventoryMode`. The website cart caps quantity
  client-side only; the kitchen `COMPLETE` action then silently skips the decrement when stock is
  short (`if (product && product.stock >= item.quantity)`) and — worse — decrements
  `ALWAYS_AVAILABLE` items that must never be decremented.
- **Steps to Reproduce:** As a customer, POST `/api/customer/orders` with quantity 9999 for any
  stocked item; the order is accepted (status 201). Complete it in the kitchen queue.
- **Expected:** Order rejected with 409 when quantity > stock, and `ALWAYS_AVAILABLE` items never
  lose stock.
- **Actual:** Out-of-stock / unavailable items can be ordered and over-sold.
- **Recommended Fix:** Validate availability + stock in `createCustomerOrder` (respect
  `inventoryMode`), and honor `inventoryMode` in the `COMPLETE` handler (skip decrement only for
  `ALWAYS_AVAILABLE`; block or warn on insufficient stock for managed items).
- **Priority:** Critical (revenue + inventory integrity).

---

### HIGH PRIORITY BUGS

**H1. Any logged-in staff member can cancel or change the tenant's subscription.** — **FIXED 2026-08-04**
- **Description:** `cancelSubscription`, `changeSubscriptionPlan`, and `calculateProration` in
  `lib/actions/subscription.ts` / `lib/actions/proration.ts` only call `requireAuth()`, which
  checks `session.user.tenantId` exists — no Owner/Admin role or permission check. A Cashier with
  a valid session can cancel the plan or switch tiers and generate invoices.
- **Steps to Reproduce:** Log in as a staff user with only `CREATE_BILL`, open Settings → Billing,
  click Cancel (or call the server action directly).
- **Expected:** 403 unless the caller is the Owner/Admin (role `ADMIN` or `MANAGE_USERS`).
- **Actual:** The action succeeds.
- **Recommended Fix:** Gate these actions on `session.user.role === 'ADMIN'` (mirroring the
  website-builder gate) or a `MANAGE_USERS` permission.
- **Priority:** High.

**H2. Staff mobile JWT has no revocation — fired/deleted staff keep access up to 30 days.** — **FIXED 2026-08-04**
- **Description:** `lib/auth/mobile.ts` signs 30-day tokens with no `tokenVersion` and no user or
  tenant re-validation on subsequent requests; `deleteTenantUser`'s comment claims the JWT dies
  with the user, but that only applies to NextAuth cookie sessions. `/api/mobile/*` routes trust
  the token's `tenantId`/`role` blindly.
- **Steps to Reproduce:** Log in via `/api/mobile/auth/login`, delete the user, then call
  `/api/mobile/transactions` with the old token.
- **Expected:** 401 (user no longer exists / tokenVersion bumped).
- **Actual:** Token stays valid for its full 30-day life.
- **Recommended Fix:** Embed `tokenVersion` in staff tokens and check it (as `customer-mobile.ts`
  already does), or re-validate the user row on sensitive routes.
- **Priority:** High (security).

**H3. Mobile staff login ignores tenant status and subscription state.** — **FIXED 2026-08-04**
- **Description:** `/api/mobile/auth/login` checks only email + password. Web login (NextAuth)
  blocks INACTIVE tenants and lapsed subscriptions; the mobile login doesn't.
- **Steps to Reproduce:** Deactivate a tenant (or let its trial lapse), then log in on the staff
  mobile app.
- **Expected:** Login refused.
- **Actual:** Login succeeds and the app keeps working.
- **Recommended Fix:** Mirror the NextAuth checks (tenant ACTIVE + active subscription) at login.
- **Priority:** High (revenue/business-logic bypass).

**H4. Default Owner role can't edit invoices — `EDIT_TRANSACTION` / `REOPEN_OLD_TRANSACTION` are
not in the seeded Owner permissions.** — **FIXED 2026-08-04** (defaults + backfill script run on existing tenants)
- **Description:** `DEFAULT_ROLE_DEFINITIONS` in `lib/tenantOnboarding.ts` gives Owner
  CREATE_PRODUCT/EDIT_PRODUCT/DELETE_PRODUCT/VIEW_REPORTS/CREATE_BILL/MANAGE_USERS/VIEW_PROFIT/
  OVERRIDE_PRICE — but not the invoice-edit permissions the shipped Invoice Edit feature requires.
  A fresh tenant's Owner gets 403 on every invoice edit. (Cashier's `VIEW_PRODUCT` is also a
  phantom permission nothing checks.)
- **Steps to Reproduce:** Register/create a new tenant, log in as its Owner, open a completed
  invoice and edit it.
- **Expected:** Owner can edit (subject to same-day rule).
- **Actual:** 403 "Requires EDIT_TRANSACTION permission".
- **Recommended Fix:** Add `EDIT_TRANSACTION` (+ `REOPEN_OLD_TRANSACTION`) to the Owner role
  defaults, and reconcile the role definitions with the real `PERMISSIONS` set.
- **Priority:** High (business logic).

**H5. Soft-404: nonexistent tenant site URLs return HTTP 200.** — **FIXED 2026-08-04**
- **Description:** Carried forward from the 2026-07-20 audit (still open). `notFound()` executes
  but returns 200 on `/site/[tenantId]/*` page routes in this Next.js 16.2.6 install.
- **Steps to Reproduce:** `curl -o /dev/null -w '%{http_code}' /site/definitely-not-a-real-tenant`
  → 200. (Verified live.)
- **Expected:** 404.
- **Actual:** 200 — search engines and uptime monitors index invalid tenant URLs.
- **Recommended Fix:** Replace `notFound()` with an explicit `Response`-based 404 (as the
  sitemap/robots Route Handlers already do).
- **Priority:** High (SEO/infra monitoring integrity).

---

### MEDIUM PRIORITY BUGS

**M1. Duplicate invoices on Razorpay webhook retries.** — **FIXED 2026-08-04**
- **Description:** `app/api/webhooks/razorpay/route.ts` creates a fresh `Invoice` on every
  `subscription.charged` event with no idempotency/dedupe (Razorpay retries webhooks).
  (While fixing: discovered the webhook was entirely unreachable — the middleware never
  allowlisted `/api/webhooks/razorpay`, so every server-to-server call 401'd before the route.
  Allowlisted as part of this fix.)
- **Steps to Reproduce:** Replay a `subscription.charged` webhook.
- **Expected:** One invoice per charge.
- **Actual:** A duplicate PAID invoice is created each replay.
- **Recommended Fix:** Upsert keyed on `razorpayPaymentId`/subscription+period before insert.
- **Priority:** Medium.

**M2. Coupon redemptions are consumed at checkout-session creation, not at payment.** — **FIXED 2026-08-04**
- **Description:** `createCheckoutSession` increments `Coupon.redemptions` immediately; abandoned
  or retried checkouts burn the cap. Invalid coupons also silently apply no discount instead of
  erroring.
- **Steps to Reproduce:** Create a checkout with a limited coupon, abandon payment, repeat.
- **Expected:** Redemption counted only on successful payment.
- **Actual:** Cap consumed by abandoned sessions.
- **Recommended Fix:** Move the increment to the webhook/payment-confirmed path; surface invalid
  coupon errors in `createCheckoutSession`.
- **Priority:** Medium.
- **Resolution (2026-08-04):** Increment moved to the `subscription.charged` webhook (inside the M1 dedupe transaction, once per subscription so renewals don't re-consume it); coupon code carried via Razorpay subscription notes; `createCheckoutSession` now throws on invalid/inactive/expired/cap-reached codes. Cap enforcement is atomic (`coupon.updateMany` with `redemptions: { lt: maxRedemptions }` + count check), so concurrent redemptions can't overshoot. Documented edge: a coupon that fully discounts the plan to ₹0 never produces a Razorpay charge, so it isn't counted (same as the old code, which also skipped `finalAmount === 0`).

**M3. Single-payment path accepts underpayment.** — **FIXED 2026-08-04**
- **Description:** In `buildTransactionPlan`, only the split-payments path validates that paid
  ≥ net. The single `paymentMethod/amountReceived` path trusts the client's `changeAmount`.
- **Steps to Reproduce:** POST `/api/transactions` with `amountReceived` < `netAmount`.
- **Expected:** 400 underpayment error.
- **Actual:** Sale completes with `changeAmount` as sent.
- **Recommended Fix:** Validate `amountReceived >= netAmount` (or require an explicit
  credit/partial flag) for the single-payment path too.
- **Priority:** Medium.

**M4. Invoice edit reconciles BATCH/SERIAL stock on the base product.** — **FIXED 2026-08-04**
- **Description:** `editTransaction` keys old/new lines by `productId::variantId` only; a removed
  or reduced BATCH/SERIAL line credits/debits `Product.stock` instead of the batch/serial row.
- **Steps to Reproduce:** Edit a completed invoice that contained a BATCH item, removing it.
- **Expected:** Batch stock credited back.
- **Actual:** Base product stock is adjusted.
- **Recommended Fix:** Extend the line key with `batchId`/`serialId` and route reconciliation to
  the right table (and add those fields to the edit item input).
- **Priority:** Medium.
- **Resolution (2026-08-04):** Line key extended to `productId::variantId::batchId::serialId`; reconciliation routes by product type (BATCH → `ProductBatch.stock` with the fresh-sale `gte` guard, SERIAL → `ProductSerial.status` SOLD↔AVAILABLE, VARIANT/SIMPLE unchanged); `batchId`/`serialId` accepted in the edit item input and persisted on rewritten lines. The missing-ref guard applies to ADDITIONS only — legacy lines whose ref is already null (created before the fix, or corrupted by this bug) stay removable via the base-product fallback instead of 400-blocking the whole edit. Edit UI preserves the refs and refuses to add BATCH/SERIAL products (no picker in that editor). Verified live end-to-end (removal credits the batch, not the base product; add decrements + persists ref; missing ref on add → 400; legacy null-ref line still removable).

**M5. Low-stock alerts ignore per-product `minStockThreshold`.** — **FIXED 2026-08-04**
- **Description:** `getLowStockItems`/`getOverviewCounts` hardcode `stock <= 10`; a product with
  `minStockThreshold = 50` won't flag until stock is 10.
- **Steps to Reproduce:** Set a product's threshold to 50 with stock 20; open Dashboard.
- **Expected:** Shown as low stock.
- **Actual:** Not flagged.
- **Recommended Fix:** Compare against `minStockThreshold` in the queries.
- **Priority:** Medium.

**M6. Superadmin `createTenant` is non-atomic and sends no owner credentials email.** — **FIXED 2026-08-04** (atomicity + email done; PENDING filter is U2, deferred)
- **Description:** `createTenant` calls `seedTenantWorkspaceDefaults` then creates the
  subscription/invoice/roles/user sequentially outside one `$transaction` — a mid-way failure
  orphans a tenant with no login. No email is ever sent to the owner (the "Owner Receives Login"
  workflow step relies on out-of-band sharing). Self-registered tenants (when C1 is fixed) are
  created PENDING with no email notification to the superadmin, and the Tenants filter dropdown
  has no PENDING option.
- **Steps to Reproduce:** N/A (code review).
- **Expected:** Atomic creation + welcome email with login instructions.
- **Actual:** Partial-creation risk; no email; no PENDING filter.
- **Recommended Fix:** Wrap in `$transaction`; send a welcome/credentials email via `lib/mail.ts`;
  add PENDING to the status filter.
- **Priority:** Medium (workflow completeness).

**M7. `/robots.txt` is behind the auth middleware (marketing-site SEO).** — **FIXED 2026-08-04**
- **Description:** The middleware redirects anonymous `/robots.txt` to `/auth/login` (verified
  live: 307 → login; body `"/auth/login"`). `/sitemap.xml` currently serves 200, but `robots.ts`
  content never reaches crawlers.
- **Steps to Reproduce:** `curl -L http://localhost:3000/robots.txt`.
- **Expected:** robots.txt content.
- **Actual:** Redirect to login.
- **Recommended Fix:** Allowlist `/robots.txt` (+ `/sitemap.xml`) in the middleware, or serve
  robots via a Route Handler.
- **Priority:** Medium (SEO).

**M8. Analytics day boundaries use the server clock, not `Tenant.timezone`.** — **FIXED 2026-10-26**
- **Description:** Carried forward (2026-07-12 backlog #12). `startOfDay(new Date())` in
  `lib/analytics.ts` — today/yesterday/this-month numbers are wrong for non-server-local timezones.
- **Recommended Fix:** Derive boundaries from `Tenant.timezone`.
- **Priority:** Medium.

**M9. Mass-assignment on `PATCH /api/tenants/[id]`.** — **FIXED 2026-10-26**
- **Description:** Carried forward (backlog #9). Raw request body is passed to
  `prisma.tenant.update({ data: body })`. SUPERADMIN-gated, so lower risk, but allows updating
  fields like `dbConnectionString`/`version` unintentionally.
- **Recommended Fix:** Whitelist fields (as PUT already does).
- **Priority:** Medium.

**M10. Money stored as `Float` with JS float math.** — **DEFERRED 2026-10-26** (needs Decimal migration + tests; see 2026-10-26 entry)
- **Description:** Carried forward (backlog #5). Rounding drift compounds across item → coupon →
  bill % → loyalty → tax. No test suite covers the money math.
- **Recommended Fix:** Move to integer paise/`Decimal`, or at minimum round at each boundary and
  add unit tests for `lib/services/transactions.ts`.
- **Priority:** Medium (correctness at scale).

---

### MINOR UI ISSUES

**[FIXED 2026-10-26] U1. `test.js`/scripts lint debt — `npx eslint` reports 1184 errors / 850 warnings** (most in
`scripts/*.js` `require` imports, some real: `types/next-auth.d.ts` unused import, a binary
`scripts/test.js`). Not runtime-blocking but `npm run lint` cannot pass. Recommend scoping ESLint
away from `scripts/` and cleaning the app-code findings.

**[FIXED 2026-10-26] U2. Tenants list filter has no PENDING status option** while PENDING tenants exist (register
flow creates them). Badges render PENDING in yellow but you can't filter for them.

**[FIXED 2026-10-26 — order ref shown; full tracking page is a feature gap] U3. Guest checkout success is a transient toast only** — no order-tracking page/link is shown
on the tenant website after placing an order.

**[FIXED 2026-10-26] U4. `getTenantUsers` server action isn't permission-gated** — any staff session can list all
tenant users' names/emails/phones (minor info exposure; the page itself may not be linked).

**[FIXED 2026-10-26] U5. QR codes (Tables + Website Builder) render via third-party `api.qrserver.com`** — carried
forward (backlog/2026-07-20 #12). Works offline only for tenants; external dependency + privacy.
Recommend switching to the bundled `qrcode.react` (self-hosted, already a dependency).

**[RESOLVED earlier — no carousel buttons remain; Reservation dead button fixed 2026-10-26] U6. `premium-food/Team.tsx` carousel buttons with no onClick** — carried forward (2026-07-20
#13), still dead UI.

**[FIXED 2026-10-26] U7. Manager cannot save Settings** (settings route requires `MANAGE_USERS`, which Manager lacks)
— likely intended, but there's no UI hint that the Save button will 403.

---

### PERFORMANCE ISSUES

**[FIXED 2026-10-26] P1. The NextAuth `jwt` callback does 2–3 DB queries on every authenticated request**
(`user.findUnique` + `tenant.findUnique` + `getActiveSubscription`, which itself loads the tenant
with subscriptions) via every `getServerSession`. This is the single biggest per-request cost on
all admin/mobile-web API routes.

**[FIXED 2026-10-26] P2. `getProfitTrendData` cost subquery scans `TransactionItem` across all tenants** before the
outer join filters (carried forward, backlog #13).

**[PARTIALLY FIXED 2026-10-26 — IP spoofing closed; shared store deferred] P3. Rate limiter is in-memory + single-process** (carried forward). State resets on restart and
isn't shared across instances; also trusts `x-forwarded-for` directly, which is client-spoofable
when not behind a trusted proxy.

**[MOSTLY FIXED 2026-10-26 — pagination done; trigram search index still open] P4. No pagination on several list endpoints** — `/api/tenant/orders` (take 100), store menu
(take 200), customer stores — fine today, but unindexed `contains` searches (`/api/tenants`,
mobile products/customers) will degrade as data grows.

---

### SECURITY ISSUES

**[FIXED 2026-10-26] S1. No rate limiting on authentication endpoints** — `/api/mobile/customer/auth/login`,
`/api/mobile/customer/auth/register`, `/api/customer/auth/register`, `/api/mobile/auth/login` are
all unauthenticated + unthrottled (bcrypt slows brute force but doesn't stop abuse/account spam).
`/api/customer/auth/register` also doesn't validate email format.

**[FIXED 2026-08-04 via H2/H3] S2. Staff mobile token gap** (see H2/H3) — no `tokenVersion`, no tenant-status/subscription
re-check.

**S3. Silent Razorpay simulation mode** — **PARTIALLY FIXED 2026-08-04** (webhook path closed) — **FIXED 2026-10-26** (simulator page gated + IDOR closed)
`lib/razorpay.ts` treats missing/dummy keys as simulation and `verifyRazorpayWebhook` returns
`true` in simulation. If env vars are missing in a "production" deploy, the whole billing flow
mocks itself and unsigned webhooks are accepted. The webhook route now refuses to process any
webhook in simulation mode under `NODE_ENV=production` (503) — added because M1 had to allowlist
`/api/webhooks/razorpay`, which would otherwise have made the simulation hole exploitable by
anonymous callers. Still open: the rest of the billing flow (checkout/plans) silently mocks
itself; a broader "refuse to start in simulation when production" guard is recommended.

**[FIXED 2026-10-26] S4. `AGENTS.md` still instructs AI agents to read `node_modules/next/dist/docs/`** — the
prompt-injection vector documented in earlier entries (fake "AI agent hint" in
`node_modules/next/dist/docs/index.md`). Recommend deleting that instruction from `AGENTS.md` and
CLAUDE.md.

**[FIXED 2026-10-26 — column dropped] S5. `Tenant.dbConnectionString` (plaintext, unused)** — carried forward (backlog #17); remove
or encrypt.

**[FIXED 2026-10-26] S6. `/api/mobile/*` CORS is `Access-Control-Allow-Origin: *`** — acceptable for bearer-token
APIs, but worth narrowing to the mobile app origins when the app ships.

**[FIXED 2026-10-26] S7. `SessionSync.tsx` mirrors the session into `localStorage`** — not the JWT itself (cookie
remains httpOnly), but user profile data sits in localStorage; consider clearing on sign-out (it
is, in TopNav) and gating the sync component to authenticated pages.

**[NO CHANGE NEEDED 2026-10-26 — no cap exists, so no race] S8. Coupon/`Discount` usage has no atomicity guard** (carried forward, backlog #6) — no
redemption cap on `Discount`; the TOCTOU between check and apply exists for store coupons.

---

### DATABASE ISSUES

**[NO CHANGE NEEDED 2026-10-26 — each has a tenantId-leading index; real gap was TransactionItem, fixed] D1. Missing `@@index([tenantId])` on `Product`, `Transaction`, `Role`, `Shop`** (carried
forward, backlog #7). `Transaction`/`Product` have composite indexes that cover most paths; the
single-column ones are still worth adding for count/filter queries.

**[CORRECTED 2026-10-28 — the rebaseline existed in the repo but was never registered in any existing database, so `migrate deploy` would fail there; dev DB fixed with `migrate resolve`, prod procedure in runbook §3.1] D2. `prisma migrate dev` is broken** (carried forward, backlog #19) — shadow-DB replay fails on
`20260708190000_add_stock_check_constraints` (schema drifted from history via an earlier `db
push`). Only `migrate deploy` works. Needs a proper baselining before release.

**[FIXED 2026-10-26] D3. `TenantSubscription.status` drift** — the dunning cron writes `'SUSPENDED'`, which isn't in
the documented set (ACTIVE/TRIAL/CANCELLED/PAST_DUE/EXPIRED/UNPAID); `getActiveSubscription`
ignores it (good outcome, inconsistent vocabulary). Align to one set.

**[FIXED 2026-10-26] D4. `Product.gstInclusive`/`gstRate` per-product vs `Shop.defaultTaxRate` tenant-level fallback**
— two tax systems coexist; the POS path uses product GST, the online-order path uses
`Shop.defaultTaxRate`. Risk of inconsistent tax between POS and online orders for the same item.

**[FIXED 2026-10-26] D5. `OrderRequest` statuses in code (`ON_HOLD`) vs schema comment** (PENDING/ACCEPTED/PREPARING/
READY/COMPLETED/REJECTED/CANCELLED) — `ON_HOLD` isn't documented but is used. Harmless, but
finish the documentation or rename.

**[FIXED 2026-10-26 — Discount.code per-tenant; Customer.email intended] D6. `Customer.email` not unique; `Discount.code` globally unique (not per-tenant)** — review
against intended semantics before scale.

**[FIXED 2026-10-26 — delete flows return clear 409] D7. No cascade rules on `TransactionItem.product`, `OrderRequest.customer/table`, `ComboItem
.component`** (default Restrict) — deleting a product used in a sale/combo will fail with FK
errors; confirm the app's delete flows handle this (product deletion appears to soft-skip
in-use products).

---

### BUSINESS LOGIC ISSUES

**[FIXED 2026-10-26] B1. Kitchen COMPLETE creates transactions with `paymentMethod: 'PENDING'`** and doesn't create
`TransactionPayment` rows — reports that aggregate on `TransactionPayment` (Payment Summary,
Payment Method chart) undercount online orders. Either create a payment row at COMPLETE (e.g.
`UPI`/`CASH` collected at counter) or exclude PENDING from those aggregates.

**[FIXED 2026-10-26] B2. Online-order tax uses `Shop.defaultTaxRate`, ignoring per-product `gstRate`/`gstInclusive`**
— customers see different totals on the website vs the POS for the same items.

**[FIXED 2026-10-26] B3. `checkFeatureLimit('transactions')` counts this calendar month; `getPeriodTotals` mixes a
rolling 7-day window with calendar month/year** (carried forward, backlog #11) — dashboard cards
mislead early in a period.

**[FIXED 2026-10-26] B4. Cashier's `VIEW_PRODUCT` permission doesn't exist in `PERMISSIONS`** — role definitions and
the actual permission set have drifted; a cashier's reported permissions don't map to any real
check (products page appears ungated for cashiers).

**[FIXED 2026-10-26] B5. `editTransaction`'s same-day window uses `toDateString()` on server time** — a sale at 23:30
server time edited at 00:10 (tenant's later timezone) incorrectly requires
REOPEN_OLD_TRANSACTION. Use tenant timezone for the day boundary.

**[FIXED 2026-10-26] B6. No notification to the superadmin when a tenant registers (PENDING)** — approval workflow
has no alert/queue; new signups can sit PENDING indefinitely with no one looking.

---

### RECOMMENDED RC-1 GATE DECISIONS (for approval before any implementation)

1. **Blocking for launch:** C1 (register 401), C2 (order stock validation), H1 (subscription
   actions authorization), H2/H3 (mobile staff JWT), H4 (Owner invoice-edit permission), M7
   (robots.txt). — **ALL DONE 2026-08-04** (C1/C2/H1–H5 batch + M1/M3/M5/M6/M7 batch).
2. **Strongly recommended before GA:** M1 (webhook idempotency), M3 (underpayment), M5
   (low-stock threshold), M6 (atomic tenant creation + owner email), S1 (auth rate limiting),
   S3 (simulation-mode guard), D2 (migration baselining). — **M1/M3/M5/M6 DONE 2026-08-04**;
   S1, S3, D2 still open. M2 (coupon redemption at payment) + M4 (BATCH/SERIAL edit
   reconciliation) also DONE 2026-08-04.
3. **Deferred to hardening sprints:** M8–M10, P1–P4, S4–S8, D1/D3–D7, U1–U7, B1–B6. — **Addressed
   2026-10-26** except M10, P3 (shared store), and P4's search index — see the 2026-10-26 entry.
4. Also recommended: remove the `AGENTS.md` → `node_modules` docs instruction (S4) and add
   `PENDING` to the tenants status filter (U2) as zero-risk hygiene fixes.

---

## 2026-07-20 — Feature work: Website Builder production-readiness implementation (Phases 1-4)

**Scope:** Follow-up to the audit below. Implementing the 14-phase remediation plan one phase at a
time, verifying each with `next build` and live server testing against a real seeded tenant before
moving on.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Phase 1: dead-code cleanup + broken links | Relocated `menuThemes.ts`/`menuUtils.ts` (genuinely live deps of `/site`, mis-filed under the old `/menu` tree) to `lib/website/`. Turned `app/menu/[tenantId]/about` and `/contact` into redirect shims to `/site/...` equivalents (matching the existing root-page pattern), then deleted the now-fully-dead `MenuShell.tsx`, `layout.tsx`, `data.ts`. Fixed 15 links across every theme's Navbar/Footer/Hero, the builder's own quick-link, and 3 customer-app "Browse Menu"/"Reorder" buttons that all pointed at `/menu/{id}/shop` — a route that never existed. |
| 2 | **Critical, found via live testing**: `middleware.ts` allowlisted `/menu` but never `/site` | The entire public tenant website (and its lead-capture/visit-tracking APIs) was returning a login redirect / 401 to every anonymous visitor. Fixed by allowlisting `/site`, `/s` (QR short-link), and `/api/website/lead`+`/api/website/visit`. This is arguably the single highest-impact fix in this pass — nothing about the site was reachable by real customers before it. |
| 3 | Phase 2: real section editors | New `SectionEditor.tsx` with add/edit/delete/reorder for every array-based section (features, categories, gallery, testimonials incl. rating, team). Added About and Contact/Business-Info tabs to the builder, wired to `updateMenuContent` (existing but orphaned server action) and `WebsiteConfig.businessInfo`. Fixed `AboutContent.tsx`/`ContactContent.tsx`, which were shipping hardcoded fake filler text ("Our journey began...") and fake business hours to every tenant's live site regardless of their real data. |
| 4 | Phase 3: image uploads | Relocated the existing Cloudinary `ImageUpload.tsx` from `app/(app)/tenants/add/` (already being reached into cross-folder by 3 other pages) to `components/`, wired it into the builder for hero background, logo, cover image, and every gallery/team/testimonial image field. |
| 5 | Phase 4: real page enable/disable | Added `Website.pages` JSON column (migration `20260720120000_website_pages_visibility`, applied via `migrate deploy` per the project's established shadow-DB workaround), a real toggle UI, and nav-link hiding across all 6 themes' Navbar/Footer. |
| 6 | **Critical, found via live testing**: `notFound()` does not reliably set a 404 HTTP status anywhere under `app/site/[tenantId]/*` in this Next.js 16.2.6 install | Verified via bisection: an isolated test route with byte-identical logic nested at the same layout depth returned a correct 404; the real `about`/`contact`/`shop` pages did not, consistently, in both `next dev` and a production `next build` + `next start`. Confirmed via temporary logging that `notFound()` genuinely executes (control flow halts) but the response is still `200 OK` with the real page content. **This predates this session** — even the original `if (!tenant) notFound()` for a nonexistent tenant slug returns 200. Not root-caused (see Open below). Worked around for the new page-toggle feature only: disabled pages now render a `PageDisabled` component (200, honest "not available" copy, `robots: noindex`) instead of relying on `notFound()`. The underlying bug still affects the missing-tenant case on `/site/[tenantId]`, `/about`, `/contact`, `/shop` — those still return 200 for a URL that doesn't correspond to any tenant. |
| 7 | Phase 5: SEO tab + per-tenant sitemap/robots | Added `seo.keywords`/`seo.canonicalUrl` to the type, a full SEO tab (title/description/keywords/canonical/OG image via the same Cloudinary uploader), and wired all of it into the homepage's `generateMetadata` (title, description, keywords, `openGraph.images`, `alternates.canonical`). Added `app/site/[tenantId]/sitemap.xml/route.ts` and `robots.txt/route.ts` — Route Handlers rather than Next's native `sitemap.ts`/`robots.ts` file convention, since those generate one global file and this app is multi-tenant on a shared path (`/site/{tenantId}`), not per-domain. Sitemap correctly omits disabled pages. Confirmed these return a real, correct 404 for a nonexistent tenant (Route Handlers set status explicitly via `Response`, so they're unaffected by the notFound() bug in #6). |
| 8 | Phase 7: Appearance — accent color + typography | Added `accent` to `appearance.colors` and wired `--theme-accent` CSS var into `SitePageShell.tsx` + all 6 theme `Layout.tsx` files. Added Heading/Body Font free-text inputs, wired via `--theme-font-heading`/`--theme-font-body` CSS vars and a new `.site-shell` rule in `globals.css` that cascades font-family through normal CSS inheritance — no per-component changes needed beyond the 7 files that set the CSS vars. Each theme's existing hardcoded default font (e.g. premium-food's Nunito/Quicksand) is now the *fallback* baked into the variable, not a competing inline style, so themes keep their distinct look until a tenant overrides it. Verified live: custom body/heading fonts and accent color both render correctly on the homepage and (via the shared `SitePageShell`) the About/Contact pages. **Deliberately did not** add UI for `buttonStyle`/`cardStyle` — grepped and confirmed zero theme components read those fields; every button/card radius and shadow is hardcoded per-component across ~40+ section files. Building picker UI for fields nothing renders would repeat the exact "editable but does nothing" pattern this whole audit exists to fix. Wiring it for real is a much larger job than anything else in this pass and is a reasonable place to stop and ask before taking on. |
| 9 | Phase 8: Zod validation on `/api/website` | Installed `zod` (confirmed it wasn't a dependency at all before this). New `lib/website/schema.ts` validates theme against the real 6-theme allowlist, bounds every string field's length, caps `sections` at 50 entries, and the route now rejects payloads over 500KB before even parsing JSON. Section `data` itself stays loosely typed (`z.record`) rather than fully replicating all 14 per-section-type shapes from `lib/website/types.ts` — a deliberate scope call, not an oversight; the goal was closing "arbitrary unbounded JSON with no allowlist," not a full mirror schema. Verified the schema logic directly (valid config accepted; bad theme, wrong types, oversized section arrays, and missing required fields all correctly rejected) since exercising the route itself over HTTP needs an authenticated session. |

| 11 | Phase 9: permission gating on the builder | Found the existing RBAC system (`lib/permissions.ts`, `Role.permissions` as a raw `String[]`) is unsafe to extend here: a brand-new granular permission (e.g. `EDIT_WEBSITE`) would reach **zero** existing tenants, since `Role.permissions` arrays are hardcoded once at signup (`app/api/register/route.ts:60`) with no propagation/backfill mechanism — shipping that gate would have locked every current tenant's Owner out of a feature they already use. Used `User.role === 'ADMIN'` instead (every tenant's Owner already has this from signup; regular staff get `role: 'USER'`), matching the plan's own wording ("Owner/Admin ... not ordinary staff"). Gated the page (`website-builder/page.tsx`, same Access-Denied-card pattern as `roles/page.tsx`), the API route (`api/website/route.ts`, 403), and the `updateMenuContent` server action (defense in depth, since it's reachable independently of the page). Also fixed `components/Sidebar.tsx`, which showed the "Website Builder" link to *every* staff member unconditionally — now only for `role === 'ADMIN'`, so non-owners no longer see a link that 403s. Not live-tested with a non-admin session (would need test staff credentials); the pattern is copied verbatim from `roles/page.tsx`/`settings/route.ts`, which already work this way in production. |

| 12 | Phase 10: rate-limit + validate public lead/visit endpoints | No Redis/Upstash in this project, so added a minimal in-memory fixed-window limiter (`lib/rateLimit.ts`, per-IP, self-sweeping) — documented as single-process-only, the honest tradeoff given no shared store exists yet. `/api/website/lead`: 5 requests/10min per IP, now validates email format and field lengths via a new `contactLeadSchema`, and checks the tenant actually exists before writing (was previously relying on the FK constraint to fail loudly). `/api/website/visit`: 60 requests/min per IP (higher, since legitimate page-view traffic is bursty), same validation treatment. Verified live: invalid email → 400, nonexistent tenant → 404, and the 6th request within the rate window → 429 (counts *all* POST attempts including invalid ones, by design — an attacker can't dodge the limiter by sending garbage first). Test data cleaned up afterward. |

| 13 | Phase 11: remove fake placeholder content | Grepped for it and found the fake-content pattern was worse than the original audit caught — 12 files across Features/Gallery/Testimonials/Team in fresh-harvest, fruit-fresh, organic-grove, and premium-food all had a `defaultX = [...]` array injected whenever the tenant hadn't filled in real content: fabricated named customer reviews ("Priya Sharma," "Sneha Kapoor," etc., all 5-star), stock Unsplash gallery photos, and — worst of all — `premium-food/Testimonials.tsx` had the *same* fake review text ("This place is great!...") copy-pasted three times under three different fake names, each with a random `pravatar.cc` avatar. Removed every one of these arrays; all four component types now `return null` when their content array is empty (a real customer never sees a "no reviews yet" placeholder — the section just doesn't render, same as toggling it off). Also found and fixed `premium-food/Features.tsx`, which never read `data.features` at all — it always rendered 4 hardcoded icon labels regardless of what the Phase 2 section editor saved, silently ignoring tenant edits; wired it to the real data. Removed the non-functional prev/next carousel buttons on `premium-food/Team.tsx` (flagged in the original audit, finding #13) rather than fake-wire an `onClick` — the grid already shows every member at once, there's no pagination state behind those buttons. Verified live: homepage renders 200 with zero occurrences of any fake name or `pravatar` URL. |

| 14 | **Critical, found while scoping Phase 12**: the homepage never fetched products, so every product-backed section (Popular Dishes, Menu Grid, Featured Products, Categories — used by 5 of the 6 themes) silently rendered empty on every tenant's actual live homepage | `app/site/[tenantId]/page.tsx` used `resolveTenant()`, which does not include `products`; every one of those section components reads `tenant?.products \|\| []`. Root cause: `resolveTenantWithProducts()` already existed in `lib/website/utils.ts` with exactly the right `include`, correctly used by nothing — dead code apparently written to fix this exact problem and never wired in. One-line fix: swap to `resolveTenantWithProducts()` in the homepage's `SitePage` component (left `generateMetadata` on the lighter `resolveTenant()`, which doesn't need products). Verified live with the test tenant's 5 real products (iPhone 13, Galaxy S21, Levi's Jeans, Nike Running Shoes, Coca-Cola) — none appeared before the fix, all five appeared after, rebuilt from a clean production build. |

| 15 | Phase 12: live-updating preview | Replaced the builder's `<iframe src="/site/{id}">` (only reflected saved state) with the real theme components rendered directly from in-memory `config` state — `WebsiteRenderer` + a local `CartProvider` (Navbar needs cart context or it throws) inside the builder's own client tree. Added a `trackVisit` prop to `WebsiteRenderer` (default true) and set it `false` in the preview, so editing the site doesn't spam the tenant's real visit analytics with fake page views. Link clicks inside the preview are swallowed via `onClickCapture` so the builder page itself never navigates away when someone clicks a nav link in the preview. No project run-skill existed, so verified with a real headless-Chromium session (Playwright, already available in this environment) logged in as the seeded Acme Corp owner: screenshotted the preview showing the live theme (not the old "Preview Mode" iframe placeholder) with real product data, typed a new Hero title in the Sections tab and confirmed via a second screenshot that the exact text appeared in the preview instantly with no Save click and no page reload, and confirmed clicking a "Menu" link inside the preview left the browser on `/website-builder`. Zero console errors. Confirmed the test edit was never persisted (DB still had the original title) since Save was never clicked. |

| 16 | Phase 13: draft/publish workflow — **skipped, by user decision** | Flagged before implementing that this changes what "Save" means for every tenant already using the builder live today (Save currently = go live immediately, matching every other admin tool in this app — Products, Settings, etc.), and asked how existing saved configs should migrate. User chose to skip it and keep immediate-save, consistent with the rest of the app. Not implemented. |

| 17 | Phase 14: de-duplicate theme defaults | The same 6-theme default section data was independently maintained in three places (`app/api/website/theme-defaults/route.ts`, `lib/website/utils.ts`, `app/(app)/website-builder/page.tsx`) and had already started drifting. Consolidated into one `lib/website/themeDefaults.ts` exporting `getThemeDefaultConfig(themeId, tenant?)`; all three call sites now import it instead of keeping their own copy. Verified directly (bypassing the auth-gated API route) that all 6 themes still produce correct output, tenant name/aboutText still interpolate into the hero correctly, and an unknown theme id still falls back to premium-food. | `lib/website/themeDefaults.ts` (new), `lib/website/utils.ts`, `app/api/website/theme-defaults/route.ts`, `app/(app)/website-builder/page.tsx` |

### Open — backlog

| # | Finding | Area |
|---|---|---|
| 10 | `buttonStyle`/`cardStyle` (WebsiteConfig.appearance) have no rendering support in any of the 6 themes — either wire them into every section component's button/card classes (large: ~40+ files) or drop the dead fields from the type/UI. | `lib/website/types.ts`, `components/website/themes/*/sections/*` |
| 11 | `notFound()` soft-404 bug (see #6) is unresolved for the "tenant doesn't exist" case on **page** routes — worth either a targeted Next.js bug report/upgrade check, or replacing with an explicit `Response`-based 404 if it keeps blocking. Search engines and uptime monitors currently see a healthy 200 for any invalid/deleted tenant site URL. Note this does *not* affect the new sitemap.xml/robots.txt Route Handlers (#7), which set status directly and were verified correct. | `app/site/[tenantId]/**/page.tsx` |
| 13 | Remaining phases (11-14 from the original plan) not yet started: removing remaining placeholder fallbacks (e.g. `Team.tsx`'s fake staff), live preview, draft/publish workflow, de-duplicating the triplicated theme-defaults data. | various |

---

## 2026-07-20 — Audit: Website Builder / public tenant site, production readiness

**Scope:** User wants tenants to be able to customize their entire public website and asked for a
production-readiness pass. Traced the current state of the public-site feature end to end: routing,
theme system, the Website Builder admin UI, its API routes, and the Prisma models behind it.

**Key structural finding:** two parallel public-site systems currently coexist. The old one
(`app/menu/[tenantId]/*` — `MenuShell.tsx`, `menuThemes.ts`, hardcoded MARKET/RESTAURANT themes,
About/Contact pages) has had its root `page.tsx` reduced to `redirect('/site/'+tenantId)`, but its
About/Contact/Shell code is still present — status (dead code vs. still reachable some other way) is
unclear and should be resolved before launch. The real, intended system is
`app/site/[tenantId]/*`, driven by a `Website` Prisma model and a theme registry
(`lib/website/registry.ts`) offering 6 real themes (Modern Restaurant, Fashion Store, Premium Food,
Fresh Harvest, Organic Grove, Fruit Fresh), configured via **Settings → Website Builder**
(`app/(app)/website-builder/`). The data model (`WebsiteConfig` in `lib/website/types.ts`) is
well-designed — sections, appearance, SEO, business info — but the builder UI only exposes a small
slice of it, which is the root of "not properly implemented."

### Findings

| # | Finding | Severity | Area |
|---|---|---|---|
| 1 | No UI to edit any array-based section content (features, testimonials, team members, gallery images, categories) — sections render permanently empty, and `Team.tsx` silently falls back to hardcoded fake staff ("Savannah Nguyen" etc.) with random `pravatar.cc` photos, which will ship to a real tenant's live site if untouched | Blocker | `WebsiteBuilderClient.tsx`, `components/website/themes/*/sections/Team.tsx` |
| 2 | No image upload/URL fields anywhere in the builder (hero background, logo, gallery, OG image) despite full schema/theme support; Cloudinary is already integrated for product images elsewhere in the app but not reused here | Blocker | `WebsiteBuilderClient.tsx` |
| 3 | "Manage Pages" tab is non-functional — every page shows a static "Active" badge with no real toggle or state | Blocker | `app/(app)/website-builder/WebsiteBuilderClient.tsx:246-291` |
| 4 | "View Menu / Shop" quick link points to `/menu/{tenantId}`, which now just redirects to the homepage, not to `/site/{tenantId}/shop` where the shop page actually lives | Blocker | `app/(app)/website-builder/WebsiteBuilderClient.tsx:299` |
| 5 | No UI for SEO (meta title/description/OG image/keywords), business info (address/phone/email/WhatsApp/social links), or typography/button/card style, despite all being first-class fields in `WebsiteConfig` and consumed by theme components | Blocker | `WebsiteBuilderClient.tsx`, `lib/website/types.ts` |
| 6 | Regression: the tenant-editable fields backing the About page / hero subtitle fallback (`tagline`, `aboutText`, `coverImageUrl`, `businessHours`) had a "Website Content" card in Settings as of 2026-07-12 — that card no longer exists anywhere in Settings/Branding, and no replacement UI covers these fields. Tenants currently cannot edit them at all. | Blocker | `app/(app)/settings/*` |
| 7 | `POST /api/website` writes the full client-submitted JSON straight into Prisma with no validation — `theme` isn't checked against known ids, no size limits, no schema validator (same class of gap as the app-wide "no zod anywhere" finding from 2026-07-12) | High | `app/api/website/route.ts:17-36` |
| 8 | No permission/RBAC check on the Website Builder — page only checks `session` exists, API route only checks `session.user.tenantId`. Every other sensitive action in the app (price override, product edits) is gated by a permission; this one lets any logged-in staff member redesign the public site | High | `app/(app)/website-builder/page.tsx`, `app/api/website/route.ts` |
| 9 | `/api/website/lead` (public contact form) and `/api/website/visit` (analytics beacon) are fully unauthenticated with no rate limiting and accept a raw client-supplied `tenantId` — trivially scriptable to spam any tenant's lead inbox or pollute their visit analytics | High | `app/api/website/lead/route.ts`, `app/api/website/visit/route.ts` |
| 10 | Default section content per theme is triplicated (`app/api/website/theme-defaults/route.ts`, `lib/website/utils.ts`, `app/(app)/website-builder/page.tsx`) and already drifting slightly — same "no shared source of truth" pattern as the earlier `PRESET_CATEGORIES` finding | Medium | `lib/website/utils.ts` and duplicates |
| 11 | No `sitemap.ts`/`robots.ts` for tenant public sites — hurts SEO discoverability, which matters for a "your own website" selling point | Medium | `app/site/[tenantId]/` |
| 12 | QR code generation (Settings tab in builder) calls a third-party image API (`api.qrserver.com`) on every render/download with no self-hosted fallback | Low | `WebsiteBuilderClient.tsx:317-334` |
| 13 | `Team.tsx` carousel prev/next buttons render but have no `onClick` — dead UI | Low | `components/website/themes/premium-food/sections/Team.tsx:21-28` |

### Notes

- `AGENTS.md` currently instructs agents to read docs inside `node_modules/next/dist/docs/` before
  writing code — this matches the shape of the prompt-injection attempt already flagged in the
  2026-07-12 entry (found living in `node_modules/next/dist/docs/index.md`). Worth reviewing/removing
  that instruction from `AGENTS.md` since it actively steers agents toward attacker-controlled content
  in a dependency; not acted on this session pending user confirmation.
- Nothing in this session was fixed — audit only, per user request.

---

## 2026-07-13 — Feature work: public tenant site goes multi-page

**Scope:** The single scrolling `/menu/[tenantId]` page (hero + catalog on one page) became a real
multi-page site: **Home**, **Shop**, **About**, **Contact**, sharing one nav bar and cart.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Multi-page routing | New routes: `/menu/[tenantId]` (Home), `/shop`, `/about`, `/contact`. Fixed page set (not admin-configurable) per user's choice — content is editable, pages themselves aren't added/removed/reordered. |
| 2 | Cart survives page navigation | Extracted cart/checkout/customer-auth state into `CartContext.tsx` (`CartProvider` + `useCart()`), mounted once in `layout.tsx` → `MenuShell.tsx` so it doesn't reset when navigating Home → Shop → About (React Context in a shared layout persists across client-side `<Link>` navigation; it would NOT have persisted if left as page-local `useState`, which is what the single-page version had). |
| 3 | Shared shell | `MenuShell.tsx` owns the nav bar (Home/Shop/About/Contact links, active-state via `usePathname`, cart icon with live count), floating cart bar, cart drawer, auth modal, and footer — rendered once, wraps every page. |
| 4 | Server-first pages | Home/About/Contact are plain Server Components (no client JS) — `getMenuTheme()` in `menuThemes.ts` is a pure function so theme-driven copy/labels can be computed server-side too. Only Shop (search/filter/cart interactions) and the shell (cart/auth) are client components. |
| 5 | Avoided a real gotcha | `getDirectionsUrl` needed to be callable from both a Server Component (Contact page) and a Client Component (MenuShell's cart drawer) — pulled it into a plain `menuUtils.ts` with no `"use client"` directive, since a Server Component can't safely import a plain function out of a `"use client"`-boundary module. |

### New backlog items surfaced this session

| # | Finding | Area |
|---|---|---|
| 23 | Sticky-header offset math (`top-[113px]` etc. in `shop/ShopClient.tsx`) is a hand-estimated pixel value, not measured — could drift a few px out of alignment if the nav bar's height changes later (e.g. longer tenant name wrapping to two lines). Worth swapping for a ResizeObserver-driven CSS variable if it's ever visibly off. | `app/menu/[tenantId]/shop/ShopClient.tsx` |
| 24 | Home/About/Contact are Server Components with zero client JS by design (fast, no hydration cost) — if future content needs interactivity (e.g. a photo carousel on About), that page will need a small client island rather than converting the whole page to `"use client"`. | `app/menu/[tenantId]/` |

---

## 2026-07-12 — Feature work: image upload, Base Unit master, public menu theming

**Scope:** Follow-up session after the review below — fixed the broken image upload, added a
tenant-managed "Base Unit" master list, and replaced the dead `menuTheme` feature with two real,
visually distinct public-menu identities.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Image upload 500s ("Missing Cloudinary environment variables") | Not a code bug — `.env` never had `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`. Added placeholder lines with instructions; user needs to paste in their own Cloudinary credentials. |
| 2 | Base Unit master list | New `Unit` model (tenant-scoped), `lib/actions/units.ts` (lazy-seeds 8 defaults per tenant, gated behind `EDIT_PRODUCT`), management page at `/products/units`, dropdown + inline quick-add replacing the free-text input on Add/Edit Product. |
| 3 | Public menu (`/menu/[tenantId]`) theming | `menuTheme` was a dead feature — 4 options selectable in Settings, zero effect on the rendered page. Replaced with two real, token-driven identities: **MARKET** (retail/grocery — compact list rows) and **RESTAURANT** (food service — spacious dish cards, serif display type, description line). Tokens live in `app/menu/[tenantId]/menuThemes.ts`; legacy values (DEFAULT/DARK/ELEGANT/PLAYFUL) fall back to MARKET. Tenant logo now actually renders in the header (field existed, was unused). Pitched via an Artifact mockup before building for real. |
| 4 | Menu page felt like a bare product list, not a business's own page | Added a real Hero section (cover photo or themed gradient fallback, logo, tagline, business hours/address/phone chips, "Shop Now"/"View Menu" CTA that scrolls to the catalog) and an About/Story section, both new — backed by 4 new `Tenant` fields (`tagline`, `aboutText`, `coverImageUrl`, `businessHours`) managed from a new "Website Content" card in Settings → Digital Menu. Both sections degrade gracefully to nothing/gradient when unset, so existing tenants aren't broken. |

### New backlog items surfaced this session

| # | Finding | Area |
|---|---|---|
| 19 | `prisma migrate dev` is broken — shadow-DB replay fails on `20260708190000_add_stock_check_constraints` because `ProductVariant`/`ProductBatch` were never created by a tracked migration (schema drifted from history, likely via an earlier `db push`). Worked around by hand-authoring migration SQL + `prisma migrate deploy` (skips the shadow DB) for the new `Unit` table. This will keep blocking `migrate dev` until the migration history is properly baselined. | `prisma/migrations/` |
| 20 | `PRESET_CATEGORIES` (Add/Edit Product forms) is a hardcoded array, same shape of problem the Base Unit master just fixed — worth the same treatment (tenant-managed master list) if categories need to be more flexible than the fixed 10-item list + free-text escape hatch. | `app/(app)/products/add`, `app/(app)/products/[id]/edit` |
| 21 | DARK/ELEGANT/PLAYFUL menu theme options were removed from the picker (never had a visual effect) — if a tenant already saved one of those values, the Settings picker now shows no active selection until they explicitly re-pick and save (harmless, but worth knowing). | `app/(app)/settings/menu` |
| 22 | Workflow gotcha, not a bug: `lib/prisma.ts` caches the `PrismaClient` instance on `globalThis` across hot reloads (intentional, avoids exhausting connections). After any `prisma migrate` + `prisma generate` that adds/changes fields, the running `next dev` process must be **restarted**, not just hot-reloaded, or queries referencing the new fields throw `PrismaClientValidationError: Unknown field`. Hit this firsthand adding the `Unit` model and the new `Tenant` fields. | dev workflow |

---

## 2026-07-12 — Senior-dev review: billing/transactions flow

**Scope:** Full-app architecture pass (auth, multi-tenancy, API conventions, data model) plus a
deep dive into the in-flight transactions/discounts/payments rewrite and the dashboard/analytics
rewrite.

### Fixed this session

| # | Finding | Status |
|---|---|---|
| 1 | Price tampering — `salePrice`/`purchasePrice`/`mrp` accepted from the client with no check against the `Product`/`ProductVariant` catalog (`lib/services/transactions.ts`) | **Fixed** — added `OVERRIDE_PRICE` permission; server rejects a mismatched `salePrice` unless the caller has it; `purchasePrice`/`mrp` always come from the catalog. UI price field disabled without the permission. |
| 2 | Resume-held-bill flow broken — UI deleted the held record before the sale was finalized (data loss on abandoned/failed checkout); dedicated `/api/transactions/[id]/resume` endpoint was dead code; hold request never sent `customerId`, breaking loyalty redemption on resume | **Fixed** — UI now loads a locked preview and only removes the held record when `/resume` actually completes the sale, inside one atomic transaction (`buildTransactionPlan`/`executeTransactionPlan` split in `transactions.ts`). Hold now sends `customerId`; resume restores `matchedCustomer`. |
| 3 | `VARIANT`/`BATCH`/`SERIAL` item with a missing id silently fell through to decrementing base `Product.stock` — wrong inventory row mutated | **Fixed** — now throws `TransactionError` instead of falling through. |
| 4 | Monthly transaction quota (`checkFeatureLimit`) checked before the DB transaction — concurrent checkouts could jointly exceed the plan limit | **Fixed** — quota re-checked inside the same `$transaction` right before insert (`checkFeatureLimit` now accepts an optional `tx` client). |

### Open — backlog (not yet actioned)

| # | Finding | Area |
|---|---|---|
| 5 | Money columns are all `Float` + plain JS float math (no `Decimal`/integer-cents) — rounding drift compounds across item→coupon→bill%→loyalty→tax | `prisma/schema.prisma`, `lib/services/transactions.ts` |
| 6 | Coupon validity/usage has no atomicity guard (TOCTOU) — no redemption cap on the `Discount` model at all | `lib/services/transactions.ts` |
| 7 | Missing `@@index([tenantId])` on `Product`, `Transaction`, `Role`, `Shop` — highest-traffic tenant-scoped queries | `prisma/schema.prisma` |
| 8 | No `zod` (or any schema validator) anywhere — all API input validation is manual `if` checks | app-wide |
| 9 | `PATCH /api/tenants/[id]` passes raw request body into `prisma.tenant.update({ data: body })` — mass-assignment risk | `app/api/tenants/[id]/route.ts` |
| 10 | Duplicate `prisma/seed.js` + `prisma/seed.ts`; duplicated `getRequesterPermissions` helper copy-pasted across mobile route files | `prisma/`, `app/api/mobile/*` |
| 11 | Dashboard: "Sales (7/30/365d)" cards mix a rolling 7-day window with calendar month/year-to-date — misleading early in a period | `lib/analytics.ts`, `components/dashboard/TenantDashboard.tsx` |
| 12 | Dashboard "today/yesterday" boundaries use the server's local clock instead of `Tenant.timezone` (field exists, unused) | `lib/analytics.ts` |
| 13 | `getProfitTrendData` cost subquery scans `TransactionItem` across all tenants before the outer join filters — correct but wasteful | `lib/analytics.ts` |
| 14 | No `loading.tsx`/`error.tsx` for the dashboard route — one failing query 500s the whole page | `app/(app)/dashboard/` |
| 15 | Four different currency-formatting conventions across `RevenueChart`, `AdvancedCharts`, `DashboardCharts`, `TenantDashboard` — no shared `formatCurrency` helper | `components/dashboard/*` |
| 16 | No test suite exists at all (`package.json` has zero test tooling) — `lib/services/transactions.ts`'s money math is the highest-value target | app-wide |
| 17 | `Tenant.dbConnectionString` (plaintext, unused elsewhere) — vestigial field from an earlier per-tenant-DB design | `prisma/schema.prisma` |
| 18 | Build currently fails on two pre-existing, unrelated issues: missing `react-hook-form` dependency (`BrandingClient.tsx`), and a server/client boundary bug pulling `pg`/`lib/prisma.ts` into a browser bundle via `lib/actions/proration.ts` (`app/(app)/settings/billing/BillingClient.tsx`) | `app/(app)/settings/*` |

### Notes

- Flagged and ignored a prompt-injection attempt found in `node_modules/next/dist/docs/index.md`
  (a fake "AI agent hint" instructing changes unrelated to any user request) — not a project bug,
  just recorded here for awareness since it'll reappear on any `npm install`.
