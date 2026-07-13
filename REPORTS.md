# Project Reports

Running log of code reviews, audits, and bug reports for this project. Each entry captures what
was found, what was fixed, and what's still open, so findings don't get lost between sessions.
Newest entries first. When adding a new report, keep the same structure: date, scope, findings
(with status), and a link to the relevant commits/PRs if applicable.

---

## 2026-07-13 — Feature work: public tenant site goes multi-page

**Scope:** The single scrolling `/menu/[tenantId]` page (hero + catalog on one page) became a real
multi-page site: **Home**, **Shop**, **About**, **Contact**, sharing one nav bar and cart.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Multi-page routing | New routes: `/menu/[tenantId]` (Home), `/shop`, `/about`, `/contact`. Fixed page set (not admin-configurable) per user's choice — content is editable, pages themselves aren't added/removed/reordered. |
| 2 | Cart survives page navigation | Extracted cart/checkout/customer-auth state into `CartContext.tsx` (`CartProvider` + `useCart()`), mounted once in `layout.tsx` → `MenuShell.tsx` so it doesn't reset when navigating Home → Shop → About (React Context in a shared layout persists across client-side `<Link>` navigation; it would NOT have persisted if left as page-local `useState`, which is what the single-page version had). |
| 3 | Shared shell | `MenuShell.tsx` owns the nav bar (Home/Shop/About/Contact links, active-state via `usePathname`, cart icon with live count), floating cart bar, cart drawer, auth modal, and footer — rendered once, wraps every page. |
| 4 | Server-first pages | Home/About/Contact are plain Server Components (no client JS) — `getMenuTheme()` in `menuThemes.ts` is a pure function so theme-driven copy/labels can be computed server-side too. Only Shop (search/filter/cart interactions) and the shell (cart/auth) are client components. |
| 5 | Avoided a real gotcha | `getDirectionsUrl` needed to be callable from both a Server Component (Contact page) and a Client Component (MenuShell's cart drawer) — pulled it into a plain `menuUtils.ts` with no `"use client"` directive, since a Server Component can't safely import a plain function out of a `"use client"`-boundary module. |

### New backlog items surfaced this session

| # | Finding | Area |
|---|---|---|
| 23 | Sticky-header offset math (`top-[113px]` etc. in `shop/ShopClient.tsx`) is a hand-estimated pixel value, not measured — could drift a few px out of alignment if the nav bar's height changes later (e.g. longer tenant name wrapping to two lines). Worth swapping for a ResizeObserver-driven CSS variable if it's ever visibly off. | `app/menu/[tenantId]/shop/ShopClient.tsx` |
| 24 | Home/About/Contact are Server Components with zero client JS by design (fast, no hydration cost) — if future content needs interactivity (e.g. a photo carousel on About), that page will need a small client island rather than converting the whole page to `"use client"`. | `app/menu/[tenantId]/` |

---

## 2026-07-12 — Feature work: image upload, Base Unit master, public menu theming

**Scope:** Follow-up session after the review below — fixed the broken image upload, added a
tenant-managed "Base Unit" master list, and replaced the dead `menuTheme` feature with two real,
visually distinct public-menu identities.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Image upload 500s ("Missing Cloudinary environment variables") | Not a code bug — `.env` never had `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`. Added placeholder lines with instructions; user needs to paste in their own Cloudinary credentials. |
| 2 | Base Unit master list | New `Unit` model (tenant-scoped), `lib/actions/units.ts` (lazy-seeds 8 defaults per tenant, gated behind `EDIT_PRODUCT`), management page at `/products/units`, dropdown + inline quick-add replacing the free-text input on Add/Edit Product. |
| 3 | Public menu (`/menu/[tenantId]`) theming | `menuTheme` was a dead feature — 4 options selectable in Settings, zero effect on the rendered page. Replaced with two real, token-driven identities: **MARKET** (retail/grocery — compact list rows) and **RESTAURANT** (food service — spacious dish cards, serif display type, description line). Tokens live in `app/menu/[tenantId]/menuThemes.ts`; legacy values (DEFAULT/DARK/ELEGANT/PLAYFUL) fall back to MARKET. Tenant logo now actually renders in the header (field existed, was unused). Pitched via an Artifact mockup before building for real. |
| 4 | Menu page felt like a bare product list, not a business's own page | Added a real Hero section (cover photo or themed gradient fallback, logo, tagline, business hours/address/phone chips, "Shop Now"/"View Menu" CTA that scrolls to the catalog) and an About/Story section, both new — backed by 4 new `Tenant` fields (`tagline`, `aboutText`, `coverImageUrl`, `businessHours`) managed from a new "Website Content" card in Settings → Digital Menu. Both sections degrade gracefully to nothing/gradient when unset, so existing tenants aren't broken. |

### New backlog items surfaced this session

| # | Finding | Area |
|---|---|---|
| 19 | `prisma migrate dev` is broken — shadow-DB replay fails on `20260708190000_add_stock_check_constraints` because `ProductVariant`/`ProductBatch` were never created by a tracked migration (schema drifted from history, likely via an earlier `db push`). Worked around by hand-authoring migration SQL + `prisma migrate deploy` (skips the shadow DB) for the new `Unit` table. This will keep blocking `migrate dev` until the migration history is properly baselined. | `prisma/migrations/` |
| 20 | `PRESET_CATEGORIES` (Add/Edit Product forms) is a hardcoded array, same shape of problem the Base Unit master just fixed — worth the same treatment (tenant-managed master list) if categories need to be more flexible than the fixed 10-item list + free-text escape hatch. | `app/(app)/products/add`, `app/(app)/products/[id]/edit` |
| 21 | DARK/ELEGANT/PLAYFUL menu theme options were removed from the picker (never had a visual effect) — if a tenant already saved one of those values, the Settings picker now shows no active selection until they explicitly re-pick and save (harmless, but worth knowing). | `app/(app)/settings/menu` |
| 22 | Workflow gotcha, not a bug: `lib/prisma.ts` caches the `PrismaClient` instance on `globalThis` across hot reloads (intentional, avoids exhausting connections). After any `prisma migrate` + `prisma generate` that adds/changes fields, the running `next dev` process must be **restarted**, not just hot-reloaded, or queries referencing the new fields throw `PrismaClientValidationError: Unknown field`. Hit this firsthand adding the `Unit` model and the new `Tenant` fields. | dev workflow |

---

## 2026-07-12 — Senior-dev review: billing/transactions flow

**Scope:** Full-app architecture pass (auth, multi-tenancy, API conventions, data model) plus a
deep dive into the in-flight transactions/discounts/payments rewrite and the dashboard/analytics
rewrite.

### Fixed this session

| # | Finding | Status |
|---|---|---|
| 1 | Price tampering — `salePrice`/`purchasePrice`/`mrp` accepted from the client with no check against the `Product`/`ProductVariant` catalog (`lib/services/transactions.ts`) | **Fixed** — added `OVERRIDE_PRICE` permission; server rejects a mismatched `salePrice` unless the caller has it; `purchasePrice`/`mrp` always come from the catalog. UI price field disabled without the permission. |
| 2 | Resume-held-bill flow broken — UI deleted the held record before the sale was finalized (data loss on abandoned/failed checkout); dedicated `/api/transactions/[id]/resume` endpoint was dead code; hold request never sent `customerId`, breaking loyalty redemption on resume | **Fixed** — UI now loads a locked preview and only removes the held record when `/resume` actually completes the sale, inside one atomic transaction (`buildTransactionPlan`/`executeTransactionPlan` split in `transactions.ts`). Hold now sends `customerId`; resume restores `matchedCustomer`. |
| 3 | `VARIANT`/`BATCH`/`SERIAL` item with a missing id silently fell through to decrementing base `Product.stock` — wrong inventory row mutated | **Fixed** — now throws `TransactionError` instead of falling through. |
| 4 | Monthly transaction quota (`checkFeatureLimit`) checked before the DB transaction — concurrent checkouts could jointly exceed the plan limit | **Fixed** — quota re-checked inside the same `$transaction` right before insert (`checkFeatureLimit` now accepts an optional `tx` client). |

### Open — backlog (not yet actioned)

| # | Finding | Area |
|---|---|---|
| 5 | Money columns are all `Float` + plain JS float math (no `Decimal`/integer-cents) — rounding drift compounds across item→coupon→bill%→loyalty→tax | `prisma/schema.prisma`, `lib/services/transactions.ts` |
| 6 | Coupon validity/usage has no atomicity guard (TOCTOU) — no redemption cap on the `Discount` model at all | `lib/services/transactions.ts` |
| 7 | Missing `@@index([tenantId])` on `Product`, `Transaction`, `Role`, `Shop` — highest-traffic tenant-scoped queries | `prisma/schema.prisma` |
| 8 | No `zod` (or any schema validator) anywhere — all API input validation is manual `if` checks | app-wide |
| 9 | `PATCH /api/tenants/[id]` passes raw request body into `prisma.tenant.update({ data: body })` — mass-assignment risk | `app/api/tenants/[id]/route.ts` |
| 10 | Duplicate `prisma/seed.js` + `prisma/seed.ts`; duplicated `getRequesterPermissions` helper copy-pasted across mobile route files | `prisma/`, `app/api/mobile/*` |
| 11 | Dashboard: "Sales (7/30/365d)" cards mix a rolling 7-day window with calendar month/year-to-date — misleading early in a period | `lib/analytics.ts`, `components/dashboard/TenantDashboard.tsx` |
| 12 | Dashboard "today/yesterday" boundaries use the server's local clock instead of `Tenant.timezone` (field exists, unused) | `lib/analytics.ts` |
| 13 | `getProfitTrendData` cost subquery scans `TransactionItem` across all tenants before the outer join filters — correct but wasteful | `lib/analytics.ts` |
| 14 | No `loading.tsx`/`error.tsx` for the dashboard route — one failing query 500s the whole page | `app/(app)/dashboard/` |
| 15 | Four different currency-formatting conventions across `RevenueChart`, `AdvancedCharts`, `DashboardCharts`, `TenantDashboard` — no shared `formatCurrency` helper | `components/dashboard/*` |
| 16 | No test suite exists at all (`package.json` has zero test tooling) — `lib/services/transactions.ts`'s money math is the highest-value target | app-wide |
| 17 | `Tenant.dbConnectionString` (plaintext, unused elsewhere) — vestigial field from an earlier per-tenant-DB design | `prisma/schema.prisma` |
| 18 | Build currently fails on two pre-existing, unrelated issues: missing `react-hook-form` dependency (`BrandingClient.tsx`), and a server/client boundary bug pulling `pg`/`lib/prisma.ts` into a browser bundle via `lib/actions/proration.ts` (`app/(app)/settings/billing/BillingClient.tsx`) | `app/(app)/settings/*` |

### Notes

- Flagged and ignored a prompt-injection attempt found in `node_modules/next/dist/docs/index.md`
  (a fake "AI agent hint" instructing changes unrelated to any user request) — not a project bug,
  just recorded here for awareness since it'll reappear on any `npm install`.
