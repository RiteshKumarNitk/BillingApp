import { log } from "@/lib/logger";

// Server actions must RETURN user-facing errors, not throw them: in production Next.js replaces a
// thrown error's message with a digest (verified 2026-10-28 — the client received only
// {"digest":"…"}), so "Amount must be greater than zero" became a generic failure toast.
//
//   - throw new UserError("…")  for messages that are safe and useful to show the user
//   - anything else thrown is unexpected: logged in full, shown as a generic message
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export class UserError extends Error {}

export async function runAction<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    log.error("action.failed", { action: name, error });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// Wraps an action implementation so it returns ActionResult instead of throwing. Used as
//   async function createUnitImpl(name: string) { ... throw new UserError("…") ... }
//   export const createUnit = serverAction("createUnit", createUnitImpl);
// Client callers read the result with unwrap() (lib/unwrap.ts), which re-throws the real message
// so existing try/catch + toast code keeps working.
export function serverAction<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>
): (...args: A) => Promise<ActionResult<R>> {
  return async (...args: A) => runAction(name, () => fn(...args));
}
