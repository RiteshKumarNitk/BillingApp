import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // U1: one-off CommonJS maintenance/seed scripts run directly with node — not app code, and
    // their require() style made `npm run lint` fail with ~1k findings unrelated to the app.
    "scripts/**",
    "prisma/seed.*",
    "generated/**",
  ]),
]);

export default eslintConfig;
