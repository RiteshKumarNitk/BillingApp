import type { NextConfig } from "next";

// Baseline security headers for every response. Camera (POS barcode scanner) and geolocation
// (Settings → use my location) stay available to our own origin only.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(self)" },
  // Ignored by browsers over plain http (local dev), enforced once served over https.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // CORS only for the bearer-token mobile APIs (a Flutter *web* build of cafeos-app would
        // call them cross-origin). Previously `Access-Control-Allow-Origin: *` together with
        // `Allow-Credentials: true` was applied to EVERY /api route, including the cookie-
        // authenticated staff APIs — an invalid combination that also overrode lib/cors.ts.
        // No credentials here: these APIs authenticate with an Authorization header, not cookies.
        source: "/api/mobile/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.MOBILE_API_CORS_ORIGIN || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Idempotency-Key" },
        ],
      },
    ];
  },
};

export default nextConfig;
