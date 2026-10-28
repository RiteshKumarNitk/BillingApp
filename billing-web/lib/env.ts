// Production environment validation, run once at server start (instrumentation.ts). A missing or
// placeholder secret must stop the deploy from serving traffic — never fall back to a default.

const PLACEHOLDER = /change[-_ ]?in[-_ ]?production|your[-_ ]|secret-key-here|placeholder|example|changeme|^dummy|^test$/i;
const MIN_SECRET_LENGTH = 32;

export interface EnvProblem {
  name: string;
  problem: string;
}

export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const need = (name: string) => {
    if (!env[name] || !env[name]!.trim()) problems.push({ name, problem: "missing" });
  };
  const secret = (name: string) => {
    const v = env[name];
    if (!v || !v.trim()) return problems.push({ name, problem: "missing" });
    if (PLACEHOLDER.test(v)) problems.push({ name, problem: "is a placeholder value" });
    else if (v.length < MIN_SECRET_LENGTH) problems.push({ name, problem: `shorter than ${MIN_SECRET_LENGTH} characters` });
  };

  need("DATABASE_URL");
  need("NEXTAUTH_URL");
  secret("NEXTAUTH_SECRET");
  secret("JWT_SECRET");
  secret("CRON_SECRET");

  // Reusing one secret for both the web session cookie and the bearer tokens means a leak of
  // either compromises both.
  if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET === env.JWT_SECRET) {
    problems.push({ name: "JWT_SECRET", problem: "must differ from NEXTAUTH_SECRET" });
  }

  // Real Razorpay keys without a webhook secret would reject every webhook (subscriptions would
  // never activate); dummy/missing keys put billing in simulation mode, which production refuses.
  const rzpKey = env.RAZORPAY_KEY_ID;
  if (rzpKey && !PLACEHOLDER.test(rzpKey) && !rzpKey.startsWith("dummy")) {
    need("RAZORPAY_KEY_SECRET");
    secret("RAZORPAY_WEBHOOK_SECRET");
  }

  return problems;
}
