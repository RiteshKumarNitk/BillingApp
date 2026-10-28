import { NextResponse } from 'next/server';
import { pool } from '@/lib/prisma';
import { isSimulationMode } from '@/lib/razorpay';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const DB_CHECK_TIMEOUT_MS = 3000;

// Health check for load balancers / uptime monitors / on-call:
//   200 + status "ok"       — app up, database reachable
//   503 + status "degraded" — database unreachable or too slow (instance shouldn't take traffic)
// External services are reported as configured / not configured only; they are deliberately not
// called on every probe (a monitor hitting this each minute must not spam Razorpay or SMTP).
// Never returns secrets, hostnames or connection strings.
export async function GET() {
  const started = Date.now();
  let database: { ok: boolean; latencyMs: number; error?: string; pool?: { total: number; idle: number; waiting: number } };

  try {
    await Promise.race([
      pool.query('select 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${DB_CHECK_TIMEOUT_MS}ms`)), DB_CHECK_TIMEOUT_MS)),
    ]);
    database = {
      ok: true,
      latencyMs: Date.now() - started,
      pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
    };
  } catch (error) {
    const e = error as { code?: string; message?: string } | null;
    database = { ok: false, latencyMs: Date.now() - started, error: e?.code || e?.message || 'unreachable' };
    log.error('health.database_unreachable', { error });
  }

  const body = {
    status: database.ok ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      app: { ok: true },
      database,
      payments: { configured: !isSimulationMode, mode: isSimulationMode ? 'simulation' : 'live' },
      email: { configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER) },
      storage: { configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) },
      push: { configured: !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FCM_SERVER_KEY) },
    },
  };

  return NextResponse.json(body, {
    status: database.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
