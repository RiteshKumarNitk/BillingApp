// Minimal in-memory fixed-window rate limiter for public, unauthenticated endpoints.
// Single-process only — state resets on restart and isn't shared across instances. That's an
// acceptable tradeoff here (no Redis/Upstash in this project yet); swap for a shared store first
// if this app ever runs as multiple instances behind a load balancer.
const buckets = new Map<string, { count: number; windowStart: number }>();

// Periodic sweep so `buckets` doesn't grow unbounded from one-off visitors hitting the endpoint once.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > SWEEP_INTERVAL_MS) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

// P3: a client can put anything at the *start* of X-Forwarded-For, so taking the first entry let
// an attacker rotate fake IPs to dodge every limiter. The right-most entry is the one appended by
// the proxy closest to us (the hosting platform's edge), which the client can't forge.
export function clientIpFromHeaderValues(forwarded: string | null | undefined, realIp: string | null | undefined): string {
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return realIp || 'unknown';
}

export function getClientIp(request: Request): string {
  return clientIpFromHeaderValues(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip'));
}
