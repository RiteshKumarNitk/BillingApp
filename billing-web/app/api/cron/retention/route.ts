import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';
import { log } from '@/lib/logger';

// Daily data-retention job for the append-only, high-volume tables that nothing needs forever:
//   WebsiteVisit  — one row per public page view (the fastest-growing table on the platform)
//   Notification  — customer in-app notifications that have already been read
// Deletes in bounded batches (each its own short statement) so it never holds a long lock or a
// huge transaction, and stops after a time budget — a backlog just finishes on the next run.
// Business records (sales, orders, invoices, audit logs) are NEVER touched here.
const VISIT_RETENTION_DAYS = Number(process.env.RETENTION_VISIT_DAYS || 180);
const READ_NOTIFICATION_RETENTION_DAYS = Number(process.env.RETENTION_READ_NOTIFICATION_DAYS || 90);
const BATCH = 5000;
const TIME_BUDGET_MS = 50_000;

async function deleteInBatches(sql: (cutoff: Date) => Promise<number>, cutoff: Date, deadline: number) {
  let total = 0;
  while (Date.now() < deadline) {
    const n = await sql(cutoff);
    total += n;
    if (n < BATCH) break;
  }
  return total;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = Date.now();
  const deadline = started + TIME_BUDGET_MS;
  try {
    const visitCutoff = new Date(Date.now() - VISIT_RETENTION_DAYS * 864e5);
    const notificationCutoff = new Date(Date.now() - READ_NOTIFICATION_RETENTION_DAYS * 864e5);

    const visits = await deleteInBatches(
      (cutoff) => prisma.$executeRaw`
        DELETE FROM "WebsiteVisit" WHERE "id" IN (
          SELECT "id" FROM "WebsiteVisit" WHERE "createdAt" < ${cutoff} LIMIT ${BATCH}
        )`,
      visitCutoff,
      deadline
    );
    const notifications = await deleteInBatches(
      (cutoff) => prisma.$executeRaw`
        DELETE FROM "Notification" WHERE "id" IN (
          SELECT "id" FROM "Notification" WHERE "isRead" = true AND "createdAt" < ${cutoff} LIMIT ${BATCH}
        )`,
      notificationCutoff,
      deadline
    );

    const result = { visitsDeleted: visits, readNotificationsDeleted: notifications, ms: Date.now() - started, finished: Date.now() < deadline };
    log.info('cron.retention', result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    log.error('cron.retention_failed', { error });
    return NextResponse.json({ success: false, error: 'Retention job failed' }, { status: 500 });
  }
}
