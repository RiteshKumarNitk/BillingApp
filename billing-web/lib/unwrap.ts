import type { ActionResult } from "@/lib/actionResult";

// Client-side companion to serverAction(): returns the data, or throws an Error carrying the
// server's user-facing message (which a thrown server-action error would have lost to production
// masking). Lets callers keep their existing `try { ... } catch (err) { toast(err.message) }`.
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
