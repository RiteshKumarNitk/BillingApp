import { PrismaClient } from '../generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Set it in your .env file.');
}
const connectionString = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: Pool }

const envInt = (name: string, fallback: number) => {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

// Pool sizing: DATABASE_URL should point at the provider's connection pooler (Neon "-pooler"
// host / PgBouncer), so per-instance pools stay small and the pooler multiplexes them. 5 suits
// serverless (many instances, one request each); a long-running server can raise DB_POOL_MAX.
//
// Timeouts make a sick database fail requests fast instead of hanging them:
//  - connectionTimeoutMillis: give up waiting for a connection (pool exhausted / DB unreachable)
//  - query_timeout: client-side cap on any single query. A server-side statement_timeout can't be
//    relied on through Neon's transaction-mode pooler: a startup parameter is ignored, and a
//    role-level ALTER ROLE ... SET did not reach pooled sessions either (both verified
//    2026-10-28; SET LOCAL inside a transaction does work). See docs/PRODUCTION_RUNBOOK.md.
export const pool = globalForPrisma.pool || new Pool({
  connectionString,
  max: envInt('DB_POOL_MAX', 5),
  connectionTimeoutMillis: envInt('DB_CONNECT_TIMEOUT_MS', 10_000),
  idleTimeoutMillis: envInt('DB_IDLE_TIMEOUT_MS', 30_000),
  query_timeout: envInt('DB_QUERY_TIMEOUT_MS', 30_000),
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

const adapter = new PrismaPg(pool)

// Interactive-transaction limits. maxWait MUST exceed the pool's connectionTimeoutMillis: with
// Prisma's default (2s) shorter than the pool's wait, an overloaded pool made Prisma abandon a
// transaction start while the connection request was still pending — measured in the 2026-10-28
// overload test, that left connections "idle in transaction" and later writes landing on them were
// never committed (surfaced as FK violations on sales/orders). With maxWait above the pool timeout,
// a saturated pool fails the request cleanly first and no connection is ever handed out half-open.
// timeout: generous ceiling for one checkout's statements on a slow link (default 5s).
const connectTimeoutMs = envInt('DB_CONNECT_TIMEOUT_MS', 10_000);
const transactionOptions = {
  maxWait: envInt('DB_TX_MAX_WAIT_MS', connectTimeoutMs + 5_000),
  timeout: envInt('DB_TX_TIMEOUT_MS', 15_000),
};

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter, transactionOptions })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
