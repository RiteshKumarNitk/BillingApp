import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStaffSession } from '@/lib/auth/staffSession';
import { checkRateLimit } from '@/lib/rateLimit';
import { log } from '@/lib/logger';
import { getTenantTimeZone, monthRangeInTz, zonedMidnightToUtc, wallClockInTz } from '@/lib/tenantTime';
import { expenseCategoryLabel } from '@/lib/expenseCategories';

// CSV exports for accountants: /api/export/{sales|gst|customers|expenses}
//   ?month=YYYY-MM            a calendar month in the cafe's timezone (default: current month)
//   ?from=YYYY-MM-DD&to=...   inclusive day range in the cafe's timezone (max 366 days)
// Rows are streamed in batches, so a large export never sits in server memory.

const EXPORTS = {
  sales: { permission: 'VIEW_REPORTS' },
  gst: { permission: 'VIEW_REPORTS' },
  customers: { permission: 'VIEW_REPORTS' },
  expenses: { permission: 'VIEW_PROFIT' },
} as const;
type ExportType = keyof typeof EXPORTS;

const BATCH = 1000;
const MAX_RANGE_DAYS = 366;

// Spreadsheet formula injection: a text cell starting with = + - @ (or tab/CR) is executed as a
// formula by Excel/Sheets. Prefix such text with an apostrophe. Numbers are written as numbers.
// Money to 2 decimals, rounding half away from zero on the DECIMAL value: `Math.round(v * 100)`
// rounds the binary float, so 123.445 (stored as 123.44499…) came out 123.44 — measured as a 6-paise
// drift against Postgres' numeric rounding over one month's sales. toFixed(10) gives a plain decimal
// string (no "1e-7" exponent form, float noise beyond 10 places absorbed), then the exponent shift
// moves the decimal point without a binary multiply.
function roundMoney(v: number): number {
  const sign = v < 0 ? -1 : 1;
  const plain = Math.abs(v).toFixed(10);
  return sign * Number(`${Math.round(Number(`${plain}e2`))}e-2`);
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(roundMoney(value)) : '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const line = (cells: unknown[]) => cells.map(cell).join(',') + '\r\n';

function resolveRange(sp: URLSearchParams, tz: string): { start: Date; end: Date; label: string } | { error: string } {
  const from = sp.get('from');
  const to = sp.get('to');
  if (from || to) {
    const parse = (v: string | null) => (v && /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)) || null;
    const f = parse(from);
    const t = parse(to);
    if (!f || !t) return { error: 'from and to must both be YYYY-MM-DD' };
    const start = zonedMidnightToUtc(+f[1], +f[2], +f[3], tz);
    const end = zonedMidnightToUtc(+t[1], +t[2], +t[3] + 1, tz); // inclusive "to" day
    if (end <= start) return { error: '"to" must not be before "from"' };
    if ((end.getTime() - start.getTime()) / 864e5 > MAX_RANGE_DAYS) return { error: `Range is limited to ${MAX_RANGE_DAYS} days` };
    return { start, end, label: `${from}_to_${to}` };
  }
  const month = monthRangeInTz(sp.get('month'), tz);
  return { start: month.start, end: month.end, label: month.key };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type } = await params;
  if (!(type in EXPORTS)) return NextResponse.json({ error: 'Unknown export' }, { status: 404 });
  const exportType = type as ExportType;
  const needed = EXPORTS[exportType].permission;
  if (staff.role !== 'SUPERADMIN' && !staff.permissions.includes(needed)) {
    return NextResponse.json({ error: `Forbidden: requires ${needed}` }, { status: 403 });
  }
  if (!checkRateLimit(`export:${staff.userId}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many exports. Please wait a few minutes.' }, { status: 429 });
  }

  const tz = await getTenantTimeZone(staff.tenantId);
  const resolved = resolveRange(request.nextUrl.searchParams, tz);
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
  const range = resolved; // narrowed binding — closures below don't see the in-scope narrowing

  const { tenantId } = staff;
  const fmtDateTime = (d: Date) => {
    const w = wallClockInTz(d, tz);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${w.year}-${p(w.month)}-${p(w.day)} ${p(w.hour)}:${p(w.minute)}`;
  };
  const fmtDate = (d: Date | null) => (d ? fmtDateTime(d).slice(0, 10) : '');

  // Each exporter yields CSV lines; the stream pulls them batch by batch.
  async function* rows(): AsyncGenerator<string> {
    if (exportType === 'sales') {
      yield line(['Date', 'Invoice', 'Customer', 'Phone', 'Order type', 'Payment method', 'Items', 'Gross', 'Coupon discount', 'Loyalty discount', 'Tax', 'Net', 'Status']);
      let cursor: string | undefined;
      for (;;) {
        const batch = await prisma.transaction.findMany({
          where: { tenantId, status: { not: 'HELD' }, createdAt: { gte: range.start, lt: range.end } },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: BATCH,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: {
            id: true, createdAt: true, customerName: true, customerPhone: true, orderType: true, paymentMethod: true,
            totalAmount: true, couponDiscountAmount: true, loyaltyDiscountAmount: true, taxAmount: true, netAmount: true, status: true,
            _count: { select: { items: true } },
          },
        });
        for (const t of batch) {
          yield line([fmtDateTime(t.createdAt), t.id.slice(0, 8).toUpperCase(), t.customerName, t.customerPhone, t.orderType, t.paymentMethod,
            t._count.items, t.totalAmount, t.couponDiscountAmount, t.loyaltyDiscountAmount, t.taxAmount, t.netAmount, t.status]);
        }
        if (batch.length < BATCH) return;
        cursor = batch[batch.length - 1].id;
      }
    }

    if (exportType === 'gst') {
      // Daily summary in the cafe's timezone. Per-rate (HSN) breakdown isn't possible: the GST
      // rate isn't snapshotted on sale lines.
      yield line(['Date', 'Invoices', 'Taxable value', 'GST collected', 'Invoice total']);
      const daily = await prisma.$queryRaw<{ day: Date; invoices: bigint; tax: number | null; net: number | null }[]>`
        SELECT DATE(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS day, COUNT(*) AS invoices,
               SUM("taxAmount") AS tax, SUM("netAmount") AS net
        FROM "Transaction"
        WHERE "tenantId" = ${tenantId} AND "status" != 'HELD' AND "createdAt" >= ${range.start} AND "createdAt" < ${range.end}
        GROUP BY 1 ORDER BY 1`;
      let totTax = 0, totNet = 0, totInv = 0;
      for (const d of daily) {
        const tax = Number(d.tax || 0), net = Number(d.net || 0), inv = Number(d.invoices);
        totTax += tax; totNet += net; totInv += inv;
        yield line([new Date(d.day).toISOString().slice(0, 10), inv, net - tax, tax, net]);
      }
      yield line(['TOTAL', totInv, totNet - totTax, totTax, totNet]);
      return;
    }

    if (exportType === 'customers') {
      // Not date-filtered: the customer list as of now. Bulk personal data — audited below.
      yield line(['Name', 'Phone', 'Email', 'Total spent', 'Loyalty points', 'Last purchase', 'Customer since']);
      let cursor: string | undefined;
      for (;;) {
        const batch = await prisma.customer.findMany({
          where: { tenantId },
          orderBy: { id: 'asc' },
          take: BATCH,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          select: { id: true, name: true, phone: true, email: true, totalSpent: true, loyaltyPoints: true, lastPurchaseDate: true, createdDate: true },
        });
        for (const c of batch) yield line([c.name, c.phone, c.email, c.totalSpent, c.loyaltyPoints, fmtDate(c.lastPurchaseDate), fmtDate(c.createdDate)]);
        if (batch.length < BATCH) return;
        cursor = batch[batch.length - 1].id;
      }
    }

    if (exportType === 'expenses') {
      yield line(['Date', 'Description', 'Category', 'Amount', 'Notes']);
      const expenses = await prisma.expense.findMany({
        where: { tenantId, date: { gte: range.start, lt: range.end } },
        orderBy: { date: 'asc' },
        select: { date: true, name: true, category: true, amount: true, notes: true },
      });
      let total = 0;
      for (const e of expenses) {
        total += e.amount;
        yield line([fmtDate(e.date), e.name, expenseCategoryLabel(e.category), e.amount, e.notes]);
      }
      yield line(['TOTAL', '', '', total, '']);
    }
  }

  if (exportType === 'customers') {
    await prisma.auditLog.create({
      data: { tenantId, userId: staff.userId, action: 'EXPORT_CUSTOMERS', details: 'Exported the customer list as CSV' },
    }).catch((error) => log.error('export.audit_failed', { error }));
  }

  const encoder = new TextEncoder();
  const iterator = rows();
  let count = 0;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode('﻿')); // BOM so Excel opens UTF-8 (₹, names) correctly
    },
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          log.info('export.ok', { tenantId, type: exportType, rows: count });
          controller.close();
          return;
        }
        count++;
        controller.enqueue(encoder.encode(value));
      } catch (error) {
        log.error('export.failed', { tenantId, type: exportType, error });
        controller.error(error);
      }
    },
  });

  const filename = exportType === 'customers' ? `customers_${new Date().toISOString().slice(0, 10)}.csv` : `${exportType}_${range.label}.csv`;
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
