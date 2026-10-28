// One key per checkout attempt, reused on every retry of that attempt (see
// Transaction.idempotencyKey). crypto.randomUUID only exists in secure contexts (https/localhost),
// so a POS opened over plain-http on a LAN IP falls back to getRandomValues.
export function newIdempotencyKey(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
