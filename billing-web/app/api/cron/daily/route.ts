import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { log } from '@/lib/logger';
import { GET as autoRefillStock } from '../auto-refill-stock/route';
import { GET as dunning } from '../dunning/route';
import { GET as retention } from '../retention/route';

// One scheduled entry point for all nightly jobs (vercel.json → crons). Vercel's Hobby plan allows
// only two cron jobs, each at most once a day, so the three jobs run here in sequence instead of
// as three separate crons. Each job:
//   - is isolated: one failing never stops the others; the response reports each outcome
//   - is idempotent, so a duplicate trigger is harmless and a failed night simply catches up on
//     the next run (Vercel does not retry failed cron invocations)
// The individual routes stay callable on their own (same CRON_SECRET) for manual re-runs.
export const maxDuration = 60;

const JOBS = [
  // First: reset AUTO_REFILL stock before the cafe opens.
  { name: 'auto-refill-stock', run: autoRefillStock },
  { name: 'dunning', run: dunning },
  { name: 'retention', run: retention },
] as const;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, { ok: boolean; status: number; ms: number; body?: unknown }> = {};
  for (const job of JOBS) {
    const started = Date.now();
    try {
      const res = await job.run(request);
      const body = await res.json().catch(() => null);
      results[job.name] = { ok: res.ok, status: res.status, ms: Date.now() - started, body };
    } catch (error) {
      log.error('cron.job_crashed', { job: job.name, error });
      results[job.name] = { ok: false, status: 500, ms: Date.now() - started };
    }
  }

  const failed = Object.entries(results).filter(([, r]) => !r.ok).map(([name]) => name);
  if (failed.length) log.error('cron.daily_failed_jobs', { failed, results });
  else log.info('cron.daily_ok', { results });

  // Non-2xx when any job failed, so Vercel's cron log marks the run as failed.
  return NextResponse.json({ success: failed.length === 0, failed, results }, { status: failed.length ? 500 : 200 });
}
