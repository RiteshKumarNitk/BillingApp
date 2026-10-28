// Minimal structured logger: one JSON object per line on stdout/stderr, which every log platform
// (Vercel, Datadog, Loki, CloudWatch...) can index and alert on without extra dependencies.
//
// Redaction is key-based and recursive: any field whose name looks sensitive is replaced before
// the line is written, so a careless `log.error("x", { body })` can't leak a password, token,
// secret or payment credential. Phone numbers and emails are masked rather than dropped so
// incidents are still debuggable.

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const SENSITIVE_KEY = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|signature|otp|resetcode|card|cvv|upi[-_]?pin|connectionstring|database_url/i;
const EMAIL_KEY = /email/i;
const PHONE_KEY = /phone|mobile/i;

function maskEmail(v: string) {
  const [user, domain] = v.split("@");
  if (!domain) return "[redacted]";
  return `${user.slice(0, 2)}***@${domain}`;
}

function maskPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "[redacted]";
}

function redact(value: unknown, key = "", depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (value === null || value === undefined) return value;
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") {
    if (key && EMAIL_KEY.test(key)) return maskEmail(value);
    if (key && PHONE_KEY.test(key)) return maskPhone(value);
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: (value as Error & { code?: unknown }).code, stack: value.stack?.split("\n").slice(0, 8).join("\n") };
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, key, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = redact(v, k, depth + 1);
    return out;
  }
  return value;
}

const MIN_LEVEL: Level = (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === "production" ? "info" : "debug");
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function write(level: Level, event: string, fields?: Fields) {
  if (ORDER[level] < ORDER[MIN_LEVEL]) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(redact(fields || {}) as Fields) });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Fields) => write("debug", event, fields),
  info: (event: string, fields?: Fields) => write("info", event, fields),
  warn: (event: string, fields?: Fields) => write("warn", event, fields),
  error: (event: string, fields?: Fields) => write("error", event, fields),
};

// Exported for tests.
export const __redactForTest = redact;
