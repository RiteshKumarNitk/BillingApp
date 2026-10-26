// Shared auth for /api/cron/* routes. These are called by the hosting platform's scheduler with no
// session cookie (middleware allowlists /api/cron), so the CRON_SECRET is the only authentication.
// Accepts either `Authorization: Bearer <CRON_SECRET>` (what Vercel Cron sends) or `?secret=`.
// In production a missing CRON_SECRET refuses every call rather than leaving the jobs open; in
// development the check is skipped when no secret is configured so the jobs can be run by hand.
export function isAuthorizedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  const header = request.headers.get('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const query = new URL(request.url).searchParams.get('secret');
  return bearer === expected || query === expected;
}
