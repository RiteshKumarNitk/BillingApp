# CafeOS (billing-web) — Production Runbook

Operational facts and procedures for running billing-web in production. Everything marked
**measured** comes from the 2026-10-28 load/integrity testing (see `REPORTS.md`); everything marked
**NOT VERIFIED** must be confirmed by whoever operates production before go-live.

---

## 1. Topology and sizing

**Deploy the app in the same region as the database.** The database is Neon `ap-southeast-1`
(Singapore). Measured from a machine ~72 ms away, every query paid that round trip; a POS checkout
issues ~25 sequential statements, so it took ~1.8 s and held a pooled connection the whole time.
In-region round trips are ~1 ms, so the same work is roughly 50× cheaper. This is the single
biggest performance factor — no code change compensates for a cross-region app.

**Connection pool (`DB_POOL_MAX`, default 5 per instance).** `DATABASE_URL` must point at the Neon
*pooler* host (`-pooler` in the hostname). Measured on one instance at 72 ms RTT:

| Pool | Throughput ceiling | Errors at 80 / 150 concurrent users |
|---|---|---|
| 5  | ~8 req/s  | 9.8% / 22% (before the transaction fix in §3.4) |
| 20 | ~27–30 req/s | 0% / 0% (after the fix) |

Guidance: serverless (many short-lived instances) → keep 5; one long-running Node server → 20.
Keep `instances × DB_POOL_MAX` well under the pooler's client limit.

**NOT VERIFIED:** capacity of the production topology. All throughput numbers above are from a
single `next start` process on a developer machine with a cross-region database; they are a lower
bound for an in-region deployment, not a capacity claim. Re-run §8 against staging in-region.

---

## 2. Environment variables

The server **refuses to serve requests** in production if any of these are missing or still a
placeholder (`instrumentation-node.ts` → `lib/env.ts`). Every request then returns 500 and
`/api/health` is 500, so a load balancer keeps the instance out of rotation. (Next.js keeps the
process alive rather than exiting; check logs for `startup.env_invalid`.)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooler** URL |
| `NEXTAUTH_URL` | yes | Public base URL, e.g. `https://app.example.com` |
| `NEXTAUTH_SECRET` | yes | ≥32 chars, random, ≠ `JWT_SECRET` |
| `JWT_SECRET` | yes | ≥32 chars, random — signs mobile app tokens |
| `CRON_SECRET` | yes | ≥32 chars — every `/api/cron/*` call is refused without it |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | for billing | With real keys the webhook secret is required; without keys billing runs in simulation, which production refuses |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | `/api/upload` returns 503 without them |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | for email | Owner welcome, password reset, signup alerts |
| `FIREBASE_SERVICE_ACCOUNT_KEY` + `FIREBASE_PROJECT_ID` | optional | Push notifications (the app side is not wired yet) |
| `NEXT_PUBLIC_SITE_URL` | recommended | Used in emails / SEO |
| `DB_POOL_MAX` | optional | See §1 |
| `DB_CONNECT_TIMEOUT_MS` (10000), `DB_QUERY_TIMEOUT_MS` (30000), `DB_TX_MAX_WAIT_MS` (connect+5000), `DB_TX_TIMEOUT_MS` (15000) | optional | Keep `DB_TX_MAX_WAIT_MS` **greater than** `DB_CONNECT_TIMEOUT_MS` (§3.4) |
| `MOBILE_API_CORS_ORIGIN` | optional | Restrict browser access to `/api/mobile/*`; default `*` |
| `RETENTION_VISIT_DAYS` (180), `RETENTION_READ_NOTIFICATION_DAYS` (90) | optional | Retention cron |
| `LOG_LEVEL` | optional | `info` in production |
| `SKIP_ENV_VALIDATION=1` | **never in production** | Escape hatch for local `next start` only |

Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Rotating `NEXTAUTH_SECRET` logs out every web session; rotating `JWT_SECRET` logs out every mobile
session.

---

## 3. Database

### 3.1 First deploy against an existing database (baseline) — REQUIRED ONCE

The migration history was re-baselined into `prisma/migrations/0_baseline_current_schema`. A
database created from the *old* history (the dev DB was) has no record of the baseline, so a plain
`prisma migrate deploy` tries to re-create every table and fails. Once per existing database:

```bash
# 1. Prove the live schema equals the baseline (output must be ONLY the post-baseline migrations)
npx prisma migrate diff --from-config-datasource --to-migrations prisma/migrations --script
#    (or diff against schema.prisma and compare with the migrations newer than the baseline)
# 2. Record the baseline as applied, then deploy the rest
npx prisma migrate resolve --applied 0_baseline_current_schema
npx prisma migrate deploy
# 3. Must print "-- This is an empty migration."
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

Done for the dev database on 2026-10-28. **NOT VERIFIED for production** (I have no access).

### 3.2 Every deploy

1. Take a Neon branch/snapshot (§5) immediately before migrating.
2. `npx prisma migrate deploy` — **before** switching traffic to the new build.
3. Run the drift check from 3.1 step 3.
4. Deploy the app; confirm `/api/health` is 200 on new instances.

Migrations in this release, in order — all additive except one:

| Migration | Kind | Notes |
|---|---|---|
| `20261026120000_discount_code_per_tenant` | index swap | |
| `20261026120100_transaction_item_indexes` | new indexes | see 3.3 for large tables |
| `20261026130000_drop_tenant_db_connection_string` | **DESTRUCTIVE** | drops an unused column (only ever placeholders) |
| `20261028100000_transaction_idempotency_key` | new column + unique index | |
| `20261028100100_order_request_tenant_idempotency` | unique index | |
| `20261028100200_user_sessions_valid_after` | new nullable column | |
| `20261028110000_query_plan_indexes` | `pg_trgm` + indexes, `IF NOT EXISTS` | see 3.3 |

### 3.3 Index migrations on large tables

Prisma runs each migration in a transaction, so `CREATE INDEX` there takes a write lock on the
table for the whole build. On a large production table, pre-build the indexes without blocking
writes, then deploy (the `IF NOT EXISTS` statements become no-ops):

```sql
-- run each separately (CONCURRENTLY can't run inside a transaction)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TransactionItem_productId_idx" ON "TransactionItem"("productId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Transaction_tenantId_kitchenStatus_idx" ON "Transaction"("tenantId","kitchenStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_tenantId_totalSpent_idx" ON "Customer"("tenantId","totalSpent");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_name_idx" ON "Customer" USING GIN ("name" gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Customer_phone_idx" ON "Customer" USING GIN ("phone" gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId","createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Tenant_website_idx" ON "Tenant"("website");
```

(`20261026120100_transaction_item_indexes` was written without `IF NOT EXISTS` and is already
applied on dev, so it can't be edited; on production, either let it build normally during a quiet
window or pre-build and then `prisma migrate resolve --applied 20261026120100_transaction_item_indexes`.)

### 3.4 Transactions and timeouts — what is enforced where

- **Interactive transactions** (`lib/prisma.ts`): `maxWait` > pool connect timeout. *Measured:*
  with Prisma's default `maxWait` (2 s) below the pool timeout, an overloaded pool left connections
  "idle in transaction" and later writes on them were lost (8 FK violations in a 40-sale burst).
  With the fix: 0 orphaned transactions, 0 FK violations across 3 bursts. Do not lower
  `DB_TX_MAX_WAIT_MS` below `DB_CONNECT_TIMEOUT_MS`.
- **Server-side `statement_timeout`:** *measured* not to reach pooled sessions — neither as a
  connection parameter nor via `ALTER ROLE … SET` (Neon's pooler reuses server connections).
  `SET LOCAL` inside a transaction does work. The app's own bounds are the client
  `query_timeout` (30 s) and the transaction `timeout` (15 s). If a hard server-side cap is
  wanted, set it in the Neon console's compute settings and confirm with `SHOW statement_timeout`
  from a fresh pooled connection.
- `idle_in_transaction_session_timeout` is 5 min on Neon (measured) — the backstop if anything
  ever leaves a transaction open.

### 3.5 Line endings and migration checksums

Prisma stores a SHA-256 of each applied migration's exact bytes. This repo has no
`.gitattributes` and Windows checkouts use `core.autocrlf=true`, so a migration is CRLF on Windows
and LF on Linux. `migrate deploy` does not re-verify applied migrations, but `migrate dev` reports
any applied migration whose bytes differ. Recommendation (decide once, then keep): add
`prisma/migrations/** text eol=lf` to `.gitattributes`, and apply production migrations only from
the CI/Linux checkout.

---

## 4. Scheduled jobs

All require `Authorization: Bearer $CRON_SECRET` (what Vercel Cron sends) or `?secret=`.

| Route | Schedule | Does |
|---|---|---|
| `/api/cron/dunning` | daily | Retries failed subscription invoices; marks UNPAID after 3 |
| `/api/cron/auto-refill-stock` | daily, before opening | Resets AUTO_REFILL product stock |
| `/api/cron/retention` | daily, off-peak | Deletes website visits > 180 days and *read* notifications > 90 days, in 5k batches, ≤50 s per run. Never touches sales/orders/invoices/audit logs |

**NOT VERIFIED:** no scheduler is configured in this repo (no `vercel.json`). Configure one.

---

## 5. Backup and recovery

**NOT VERIFIED — I had no access to the Neon project settings.** Production must not be called
ready until someone confirms these in the Neon console:

1. **Point-in-time restore window** (Neon "history retention"). Free plans keep ~1 day; paid plans
   7–30 days. Target: ≥7 days. Record the actual value here: `____`.
2. **Who can restore**, and that at least two people have console access.
3. **Restore drill**, done at least once before go-live and quarterly after:
   1. Neon console → Branches → *Create branch* from a past timestamp (e.g. 1 hour ago).
   2. Point a staging app at the branch's pooler URL; run the drift check (§3.1 step 3).
   3. Verify row counts on `Transaction`, `OrderRequest`, `Customer` against expectations.
   4. Record time taken (this is your real RTO).
4. **Disaster recovery (bad deploy / data corruption):**
   1. Stop writes: scale the app to 0 or enable maintenance.
   2. Create a branch at the last-good timestamp (before the incident).
   3. Either promote that branch to primary, or copy the affected rows back from it.
   4. Point `DATABASE_URL` at the restored primary; run `prisma migrate deploy`; restart.
   5. Anything written between the restore point and the stop is lost unless copied over — check
      Razorpay's dashboard for payments in that window.
5. **Off-platform copy** (protects against losing the Neon account itself): a nightly
   `pg_dump --format=custom` to separate storage, retained 30 days. **Not set up.**

---

## 6. Monitoring

- **Health:** `GET /api/health` — 200 `ok` / 503 `degraded` (database unreachable or >3 s).
  Probe every 30–60 s. *Measured:* it correctly went 503 when the pool was saturated.
- **Logs** are one JSON object per line (`lib/logger.ts`); secrets are redacted, phones/emails
  masked (*measured:* a test payload with passwords/tokens/cookies/card numbers produced no secret
  in the output). Alert on these `event` values:

| Event | Meaning | Suggested alert |
|---|---|---|
| `request.unhandled_error` | Any uncaught error in a route/page/action | >5/min |
| `process.unhandled_rejection` / `process.uncaught_exception` | Crash-class bug | any |
| `startup.env_invalid` | Instance refusing to serve | any |
| `health.database_unreachable` | DB down/slow | any |
| `pos.checkout_db_busy`, `order.create_db_busy` | Pool saturated (clients got 503 + Retry-After) | >1% of checkouts — scale or raise pool |
| `pos.checkout_failed`, `order.create_failed` | Checkout failed for a non-business reason | any |
| `upload.failed`, `upload.not_configured` | Media pipeline broken | >3/10 min |
| `cron.retention_failed` | Retention job failed | any |

**NOT VERIFIED:** no log drain or alerting is configured in this repo. Connect the platform's logs
to an alerting tool and create the alerts above.

---

## 7. Rollback

- **App:** redeploy the previous build. Safe for every migration in §3.2 *except* that the old
  build never wrote `idempotencyKey` / `sessionsValidAfter` — harmless (nullable).
- **Destructive migration** (`drop_tenant_db_connection_string`): the previous build no longer
  writes that column either (removed in the same release), so rolling the app back is safe.
  Rolling the *schema* back requires `ALTER TABLE "Tenant" ADD COLUMN "dbConnectionString" TEXT NOT NULL DEFAULT ''`.
- Migrations are forward-only; never edit an applied migration (its checksum is recorded).

---

## 8. Load and integrity testing (staging/dev only — never production)

```bash
node scripts/loadtest/seed.cjs          # ~250 MB synthetic data, tagged LOADTEST / *.invalid
node scripts/loadtest/explain.cjs       # EXPLAIN ANALYZE of the hot queries
# start the app (next start) with the same DATABASE_URL, then:
BASE_URL=http://localhost:3100 node scripts/loadtest/concurrency.cjs   # 13 integrity scenarios
BASE_URL=http://localhost:3100 LT_BURST=40 node scripts/loadtest/orphan-tx.cjs
BASE_URL=http://localhost:3100 JWT_SECRET=<server's> node scripts/loadtest/load.cjs normal peak stress spike
node scripts/loadtest/cleanup.cjs       # removes everything the seed and tests created
```

---

## 9. Incident playbooks

- **Revoke a compromised staff session (web + app) immediately:**
  `UPDATE "User" SET "sessionsValidAfter" = now() WHERE email = '<email>';`
  Takes effect within 30 s on every instance (session cache TTL); *measured:* 29 s.
- **Revoke a customer's app sessions:** `UPDATE "CustomerAccount" SET "tokenVersion" = "tokenVersion" + 1 WHERE email = '<email>';`
- **Checkouts returning 503 "system is busy":** pool saturated — check `/api/health` pool stats,
  scale instances or raise `DB_POOL_MAX`, check for long-running queries in Neon's monitoring.
- **Kitchen screen shows "N more waiting":** a backlog of never-closed online orders; complete or
  cancel old orders (the screen shows the oldest 150 per source).
