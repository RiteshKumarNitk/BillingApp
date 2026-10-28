import type { Instrumentation } from "next";

// Runs once when a server instance starts. Node-only setup (env validation, process-level crash
// handlers) lives in instrumentation-node.ts so the Edge bundle never includes it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

// Every unhandled error in a route handler, page render, server action or proxy, in one structured
// line — route, method and error, never headers/cookies (those can carry session tokens).
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { log } = await import("@/lib/logger");
  log.error("request.unhandled_error", {
    path: request.path.split("?")[0],
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    error,
  });
};
