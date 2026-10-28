// Node.js-only startup work, imported by instrumentation.ts only when NEXT_RUNTIME === "nodejs"
// (kept in its own module so the Edge bundle never sees process.on / process.version).
import { log } from "@/lib/logger";
import { validateProductionEnv } from "@/lib/env";

// Fail fast: a production instance must never boot with missing/placeholder secrets (e.g. the
// "your-secret-key-here-change-in-production" default from .env.example). Throwing here stops the
// instance before it serves a single request.
if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "1") {
  const problems = validateProductionEnv();
  if (problems.length > 0) {
    log.error("startup.env_invalid", { problems });
    throw new Error(`Invalid production environment: ${problems.map((p) => `${p.name} ${p.problem}`).join("; ")}`);
  }
}

// Last-resort crash visibility for errors that escape every request handler.
process.on("unhandledRejection", (reason) => log.error("process.unhandled_rejection", { error: reason }));
process.on("uncaughtException", (error) => log.error("process.uncaught_exception", { error }));

log.info("startup.ready", { node: process.version, env: process.env.NODE_ENV });
