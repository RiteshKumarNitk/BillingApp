// Short-TTL, in-process cache for PUBLIC, anonymous read models only (storefront tenant + menu,
// app cafe menu). These are the highest-volume requests on the platform and identical for every
// visitor of a cafe, so each instance serves them from memory for a few seconds instead of
// hitting PostgreSQL per page view.
//
// Rules:
//  - Only cache data that is already public (lib/website/publicTenant.ts projections, the public
//    store-menu payload). Never cache anything session- or customer-specific: keys contain only the
//    cafe id/slug and a public query, so one tenant's entry can never be served for another.
//  - Staleness is bounded by TTL across instances; writes on this instance call
//    invalidatePublicCache() so the editor sees their change immediately.
//  - Concurrent misses for the same key share ONE database read (in-flight de-duplication), so a
//    traffic spike on one cafe can't stampede the database.
//  - Correctness-critical reads (placing an order, tenant status, stock checks) must NOT use this.

const DEFAULT_TTL_MS = 30_000;
const MAX_ENTRIES = 2000;

type Entry = { value: unknown; expiresAt: number };
const entries = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

export async function cachedPublic<T>(key: string, load: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    try {
      const value = await load();
      if (entries.size >= MAX_ENTRIES) {
        // Drop expired first; if still full, the oldest-inserted (Map preserves insertion order).
        for (const [k, e] of entries) if (e.expiresAt <= Date.now()) entries.delete(k);
        if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value as string);
      }
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}

// Called after menu/website writes on this instance. Clearing everything is deliberately simple:
// writes are rare compared to reads, and keys may be by id or by slug.
export function invalidatePublicCache() {
  entries.clear();
}
