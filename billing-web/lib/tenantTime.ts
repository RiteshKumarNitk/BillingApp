import prisma from "@/lib/prisma";

// M8/B5: calendar boundaries ("today", "this month", "same day") must follow the tenant's own
// timezone (Tenant.timezone, an IANA name like "Asia/Kolkata"), not the server clock — a server in
// UTC otherwise starts an Indian cafe's "today" at 05:30 local time. Built on Intl (no extra
// dependency); every helper returns real UTC instants usable directly in Prisma `createdAt` filters.

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

// The wall-clock reading in `timeZone` at instant `date` (month is 1-12).
export function wallClockInTz(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function offsetMs(date: Date, timeZone: string): number {
  const w = wallClockInTz(date, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// UTC instant of local midnight on the given local calendar date. Date.UTC normalizes overflow,
// so day 0 / day 32 / month 13 roll over correctly (used for "yesterday", "next month", ...).
export function zonedMidnightToUtc(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetMs(new Date(guess), timeZone);
  // Re-check at the candidate instant in case a DST transition sits between the two readings.
  const second = guess - offsetMs(new Date(first), timeZone);
  return new Date(second);
}

export function startOfDayInTz(date: Date, timeZone: string, dayOffset = 0): Date {
  const w = wallClockInTz(date, timeZone);
  return zonedMidnightToUtc(w.year, w.month, w.day + dayOffset, timeZone);
}

export function startOfMonthInTz(date: Date, timeZone: string, monthOffset = 0): Date {
  const w = wallClockInTz(date, timeZone);
  return zonedMidnightToUtc(w.year, w.month + monthOffset, 1, timeZone);
}

export function startOfYearInTz(date: Date, timeZone: string): Date {
  const w = wallClockInTz(date, timeZone);
  return zonedMidnightToUtc(w.year, 1, 1, timeZone);
}

export function isSameDayInTz(a: Date, b: Date, timeZone: string): boolean {
  const x = wallClockInTz(a, timeZone);
  const y = wallClockInTz(b, timeZone);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

// Small per-process cache — dashboards call several analytics helpers per render, each of which
// needs the same tenant's timezone, and it changes rarely (Settings / superadmin edit).
const TZ_CACHE_TTL_MS = 60 * 1000;
const tzCache = new Map<string, { tz: string; at: number }>();

export async function getTenantTimeZone(tenantId: string): Promise<string> {
  const now = Date.now();
  const cached = tzCache.get(tenantId);
  if (cached && now - cached.at < TZ_CACHE_TTL_MS) return cached.tz;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } });
  const tz = safeTimeZone(tenant?.timezone);
  tzCache.set(tenantId, { tz, at: now });
  return tz;
}

// "MM/dd" label for a Postgres DATE value. Prisma returns DATE columns as a JS Date at UTC
// midnight, so reading UTC components avoids the label shifting a day on servers west of UTC.
export function formatDateKey(value: Date | string): string {
  const d = new Date(value);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}
