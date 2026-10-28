// Classifies "the database is momentarily saturated" failures — the connection pool couldn't hand
// out a connection in time (DB_CONNECT_TIMEOUT_MS) or the database is unreachable. These are
// transient and safe to retry (checkout/order requests carry idempotency keys), so routes answer
// 503 + Retry-After instead of a generic 500 that looks like a crash.
export function isDatabaseBusyError(error: unknown): boolean {
  const e = error as { message?: string; code?: string; cause?: { message?: string } } | null;
  const text = `${e?.message || ''} ${e?.cause?.message || ''}`;
  return (
    /timeout exceeded when trying to connect/i.test(text) ||
    /Connection terminated due to connection timeout/i.test(text) ||
    /Unable to start a transaction in the given time/i.test(text) ||
    e?.code === 'P1001' || // can't reach database server
    e?.code === 'P2028' || // transaction API error (start/expiry)
    e?.code === 'P2024'    // timed out fetching a connection from the pool
  );
}

export const DB_BUSY_RESPONSE = {
  body: { error: 'The system is busy right now. Please try again in a moment.' },
  init: { status: 503, headers: { 'Retry-After': '2' } },
} as const;
