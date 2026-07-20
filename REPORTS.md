# Project Reports

Running log of code reviews, audits, and bug reports for this project. Each entry captures what
was found, what was fixed, and what's still open, so findings don't get lost between sessions.
Newest entries first. When adding a new report, keep the same structure: date, scope, findings
(with status), and a link to the relevant commits/PRs if applicable.

---

## 2026-07-20 — Feature work: Website Builder production-readiness implementation (Phases 1-4)

**Scope:** Follow-up to the audit below. Implementing the 14-phase remediation plan one phase at a
time, verifying each with `next build` and live server testing against a real seeded tenant before
moving on.

### Done

| # | Item | Notes |
|---|---|---|
| 1 | Phase 1: dead-code cleanup + broken links | Relocated `menuThemes.ts`/`menuUtils.ts` (genuinely live deps of `/site`, mis-filed under the old `/menu` tree) to `lib/website/`. Turned `app/menu/[tenantId]/about` and `/contact` into redirect shims to `/site/...` equivalents (matching the existing root-page pattern), then deleted the now-fully-dead `MenuShell.tsx`, `layout.tsx`, `data.ts`. Fixed 15 links across every theme's Navbar/Footer/Hero, the builder's own quick-link, and 3 customer-app "Browse Menu"/"Reorder" buttons that all pointed at `/menu/{id}/shop` — a route that never existed. |
| 2 | **Critical, found via live testing**: `middleware.ts` allowlisted `/menu` but never `/site` | The entire public tenant website (and its lead-capture/visit-tracking APIs) was returning a login redirect / 401 to every anonymous visitor. Fixed by allowlisting `/site`, `/s` (QR short-link), and `/api/website/lead`+`/api/website/visit`. This is arguably the single highest-impact fix in this pass — nothing about the site was reachable by real customers before it. |
| 3 | Phase 2: real section editors | New `SectionEditor.tsx` with add/edit/delete/reorder for every array-based section (features, categories, gallery, testimonials incl. rating, team). Added About and Contact/Business-Info tabs to the builder, wired to `updateMenuContent` (existing but orphaned server action) and `WebsiteConfig.businessInfo`. Fixed `AboutContent.tsx`/`ContactContent.tsx`, which were shipping hardcoded fake filler text ("Our journey began...") and fake business hours to every tenant's live site regardless of their real data. |
| 4 | Phase 3: image uploads | Relocated the existing Cloudinary `ImageUpload.tsx` from `app/(app)/tenants/add/` (already being reached into cross-folder by 3 other pages) to `components/`, wired it into the builder for hero background, logo, cover image, and every gallery/team/testimonial image field. |
| 5 | Phase 4: real page enable/disable | Added `Website.pages` JSON column (migration `20260720120000_website_pages_visibility`, applied via `migrate deploy` per the project's established shadow-DB workaround), a real toggle UI, and nav-link hiding across all 6 themes' Navbar/Footer. |
| 6 | **Critical, found via live testing**: `notFound()` does not reliably set a 404 HTTP status anywhere under `app/site/[tenantId]/*` in this Next.js 16.2.6 install | Verified via bisection: an isolated test route with byte-identical logic nested at the same layout depth returned a correct 404; the real `about`/`contact`/`shop` pages did not, consistently, in both `next dev` and a production `next build` + `next start`. Confirmed via temporary logging that `notFound()` genuinely executes (control flow halts) but the response is still `200 OK` with the real page content. **This predates this session** — even the original `if (!tenant) notFound()` for a nonexistent tenant slug returns 200. Not root-caused (see Open below). Worked around for the new page-toggle feature only: disabled pages now render a `PageDisabled` component (200, honest "not available" copy, `robots: noindex`) instead of relying on `notFound()`. The underlying bug still affects the missing-tenant case on `/site/[tenantId]`, `/about`, `/contact`, `/shop` — those still return 200 for a URL that doesn't correspond to any tenant. |
| 7 | Phase 5: SEO tab + per-tenant sitemap/robots | Added `seo.keywords`/`seo.canonicalUrl` to the type, a full SEO tab (title/description/keywords/canonical/OG image via the same Cloudinary uploader), and wired all of it into the homepage's `generateMetadata` (title, description, keywords, `openGraph.images`, `alternates.canonical`). Added `app/site/[tenantId]/sitemap.xml/route.ts` and `robots.txt/route.ts` — Route Handlers rather than Next's native `sitemap.ts`/`robots.ts` file convention, since those generate one global file and this app is multi-tenant on a shared path (`/site/{tenantId}`), not per-domain. Sitemap correctly omits disabled pages. Confirmed these return a real, correct 404 for a nonexistent tenant (Route Handlers set status explicitly via `Response`, so they're unaffected by the notFound() bug in #6). |
| 8 | Phase 7: Appearance — accent color + typography | Added `accent` to `appearance.colors` and wired `--theme-accent` CSS var into `SitePageShell.tsx` + all 6 theme `Layout.tsx` files. Added Heading/Body Font free-text inputs, wired via `--theme-font-heading`/`--theme-font-body` CSS vars and a new `.site-shell` rule in `globals.css` that cascades font-family through normal CSS inheritance — no per-component changes needed beyond the 7 files that set the CSS vars. Each theme's existing hardcoded default font (e.g. premium-food's Nunito/Quicksand) is now the *fallback* baked into the variable, not a competing inline style, so themes keep their distinct look until a tenant overrides it. Verified live: custom body/heading fonts and accent color both render correctly on the homepage and (via the shared `SitePageShell`) the About/Contact pages. **Deliberately did not** add UI for `buttonStyle`/`cardStyle` — grepped and confirmed zero theme components read those fields; every button/card radius and shadow is hardcoded per-component across ~40+ section files. Building picker UI for fields nothing renders would repeat the exact "editable but does nothing" pattern this whole audit exists to fix. Wiring it for real is a much larger job than anything else in this pass and is a reasonable place to stop and ask before taking on. |
| 9 | Phase 8: Zod validation on `/api/website` | Installed `zod` (confirmed it wasn't a dependency at all before this). New `lib/website/schema.ts` validates theme against the real 6-theme allowlist, bounds every string field's length, caps `sections` at 50 entries, and the route now rejects payloads over 500KB before even parsing JSON. Section `data` itself stays loosely typed (`z.record`) rather than fully replicating all 14 per-section-type shapes from `lib/website/types.ts` — a deliberate scope call, not an oversight; the goal was closing "arbitrary unbounded JSON with no allowlist," not a full mirror schema. Verified the schema logic directly (valid config accepted; bad theme, wrong types, oversized section arrays, and missing required fields all correctly rejected) since exercising the route itself over HTTP needs an authenticated session. |

| 11 | Phase 9: permission gating on the builder | Found the existing RBAC system (`lib/permissions.ts`, `Role.permissions` as a raw `String[]`) is unsafe to extend here: a brand-new granular permission (e.g. `EDIT_WEBSITE`) would reach **zero** existing tenants, since `Role.permissions` arrays are hardcoded once at signup (`app/api/register/route.ts:60`) with no propagation/backfill mechanism — shipping that gate would have locked every current tenant's Owner out of a feature they already use. Used `User.role === 'ADMIN'` instead (every tenant's Owner already has this from signup; regular staff get `role: 'USER'`), matching the plan's own wording ("Owner/Admin ... not ordinary staff"). Gated the page (`website-builder/page.tsx`, same Access-Denied-card pattern as `roles/page.tsx`), the API route (`api/website/route.ts`, 403), and the `updateMenuContent` server action (defense in depth, since it's reachable independently of the page). Also fixed `components/Sidebar.tsx`, which showed the "Website Builder" link to *every* staff member unconditionally — now only for `role === 'ADMIN'`, so non-owners no longer see a link that 403s. Not live-tested with a non-admin session (would need test staff credentials); the pattern is copied verbatim from `roles/page.tsx`/`settings/route.ts`, which already work this way in production. |

| 12 | Phase 10: rate-limit + validate public lead/visit endpoints | No Redis/Upstash in this project, so added a minimal in-memory fixed-window limiter (`lib/rateLimit.ts`, per-IP, self-sweeping) — documented as single-process-only, the honest tradeoff given no shared store exists yet. `/api/website/lead`: 5 requests/10min per IP, now validates email format and field lengths via a new `contactLeadSchema`, and checks the tenant actually exists before writing (was previously relying on the FK constraint to fail loudly). `/api/website/visit`: 60 requests/min per IP (higher, since legitimate page-view traffic is bursty), same validation treatment. Verified live: invalid email → 400, nonexistent tenant → 404, and the 6th request within the rate window → 429 (counts *all* POST attempts including invalid ones, by design — an attacker can't dodge the limiter by sending garbage first). Test data cleaned up afterward. |

| 13 | Phase 11: remove fake placeholder content | Grepped for it and found the fake-content pattern was worse than the original audit caught — 12 files across Features/Gallery/Testimonials/Team in fresh-harvest, fruit-fresh, organic-grove, and premium-food all had a `defaultX = [...]` array injected whenever the tenant hadn't filled in real content: fabricated named customer reviews ("Priya Sharma," "Sneha Kapoor," etc., all 5-star), stock Unsplash gallery photos, and — worst of all — `premium-food/Testimonials.tsx` had the *same* fake review text ("This place is great!...") copy-pasted three times under three different fake names, each with a random `pravatar.cc` avatar. Removed every one of these arrays; all four component types now `return null` when their content array is empty (a real customer never sees a "no reviews yet" placeholder — the section just doesn't render, same as toggling it off). Also found and fixed `premium-food/Features.tsx`, which never read `data.features` at all — it always rendered 4 hardcoded icon labels regardless of what the Phase 2 section editor saved, silently ignoring tenant edits; wired it to the real data. Removed the non-functional prev/next carousel buttons on `premium-food/Team.tsx` (flagged in the original audit, finding #13) rather than fake-wire an `onClick` — the grid already shows every member at once, there's no pagination state behind those buttons. Verified live: homepage renders 200 with zero occurrences of any fake name or `pravatar` URL. |

| 14 | **Critical, found while scoping Phase 12**: the homepage never fetched products, so every product-backed section (Popular Dishes, Menu Grid, Featured Products, Categories — used by 5 of the 6 themes) silently rendered empty on every tenant's actual live homepage | `app/site/[tenantId]/page.tsx` used `resolveTenant()`, which does not include `products`; every one of those section components reads `tenant?.products \|\| []`. Root cause: `resolveTenantWithProducts()` already existed in `lib/website/utils.ts` with exactly the right `include`, correctly used by nothing — dead code apparently written to fix this exact problem and never wired in. One-line fix: swap to `resolveTenantWithProducts()` in the homepage's `SitePage` component (left `generateMetadata` on the lighter `resolveTenant()`, which doesn't need products). Verified live with the test tenant's 5 real products (iPhone 13, Galaxy S21, Levi's Jeans, Nike Running Shoes, Coca-Cola) — none appeared before the fix, all five appeared after, rebuilt from a clean production build. |

| 15 | Phase 12: live-updating preview | Replaced the builder's `<iframe src="/site/{id}">` (only reflected saved state) with the real theme components rendered directly from in-memory `config` state — `WebsiteRenderer` + a local `CartProvider` (Navbar needs cart context or it throws) inside the builder's own client tree. Added a `trackVisit` prop to `WebsiteRenderer` (default true) and set it `false` in the preview, so editing the site doesn't spam the tenant's real visit analytics with fake page views. Link clicks inside the preview are swallowed via `onClickCapture` so the builder page itself never navigates away when someone clicks a nav link in the preview. No project run-skill existed, so verified with a real headless-Chromium session (Playwright, already available in this environment) logged in as the seeded Acme Corp owner: screenshotted the preview showing the live theme (not the old "Preview Mode" iframe placeholder) with real product data, typed a new Hero title in the Sections tab and confirmed via a second screenshot that the exact text appeared in the preview instantly with no Save click and no page reload, and confirmed clicking a "Menu" link inside the preview left the browser on `/website-builder`. Zero console errors. Confirmed the test edit was never persisted (DB still had the original title) since Save was never clicked. |

| 16 | Phase 13: draft/publish workflow — **skipped, by user decision** | Flagged before implementing that this changes what "Save" means for every tenant already using the builder live today (Save currently = go live immediately, matching every other admin tool in this app — Products, Settings, etc.), and asked how existing saved configs should migrate. User chose to skip it and keep immediate-save, consistent with the rest of the app. Not implemented. |

| 17 | Phase 14: de-duplicate theme defaults | The same 6-theme default section data was independently maintained in three places (`app/api/website/theme-defaults/route.ts`, `lib/website/utils.ts`, `app/(app)/website-builder/page.tsx`) and had already started drifting. Consolidated into one `lib/website/themeDefaults.ts` exporting `getThemeDefaultConfig(themeId, tenant?)`; all three call sites now import it instead of keeping their own copy. Verified directly (bypassing the auth-gated API route) that all 6 themes still produce correct output, tenant name/aboutText still interpolate into the hero correctly, and an unknown theme id still falls back to premium-food. | `lib/website/themeDefaults.ts` (new), `lib/website/utils.ts`, `app/api/website/theme-defaults/route.ts`, `app/(app)/website-builder/page.tsx` |

### Open — backlog

| # | Finding | Area |
|---|---|---|
| 10 | `buttonStyle`/`cardStyle` (WebsiteConfig.appearance) have no rendering support in any of the 6 themes — either wire them into every section component's button/card classes (large: ~40+ files) or drop the dead fields from the type/UI. | `lib/website/types.ts`, `components/website/themes/*/sections/*` |
| 11 | `notFound()` soft-404 bug (see #6) is unresolved for the "tenant doesn't exist" case on **page** routes — worth either a targeted Next.js bug report/upgrade check, or replacing with an explicit `Response`-based 404 if it keeps blocking. Search engines and uptime monitors currently see a healthy 200 for any invalid/deleted tenant site URL. Note this does *not* affect the new sitemap.xml/robots.txt Route Handlers (#7), which set status directly and were verified correct. | `app/site/[tenantId]/**/page.tsx` |
| 13 | Remaining phases (11-14 from the original plan) not yet started: removing remaining placeholder fallbacks (e.g. `Team.tsx`'s fake staff), live preview, draft/publish workflow, de-duplicating the triplicated theme-defaults data. | various |

---

## 2026-07-20 — Audit: Website Builder / public tenant site, production readiness

**Scope:** User wants tenants to be able to customize their entire public website and asked for a
production-readiness pass. Traced the current state of the public-site feature end to end: routing,
theme system, the Website Builder admin UI, its API routes, and the Prisma models behind it.

**Key structural finding:** two parallel public-site systems currently coexist. The old one
(`app/menu/[tenantId]/*` — `MenuShell.tsx`, `menuThemes.ts`, hardcoded MARKET/RESTAURANT themes,
About/Contact pages) has had its root `page.tsx` reduced to `redirect('/site/'+tenantId)`, but its
About/Contact/Shell code is still present — status (dead code vs. still reachable some other way) is
unclear and should be resolved before launch. The real, intended system is
`app/site/[tenantId]/*`, driven by a `Website` Prisma model and a theme registry
(`lib/website/registry.ts`) offering 6 real themes (Modern Restaurant, Fashion Store, Premium Food,
Fresh Harvest, Organic Grove, Fruit Fresh), configured via **Settings → Website Builder**
(`app/(app)/website-builder/`). The data model (`WebsiteConfig` in `lib/website/types.ts`) is
well-designed — sections, appearance, SEO, business info — but the builder UI only exposes a small
slice of it, which is the root of "not properly implemented."

### Findings

| # | Finding | Severity | Area |
|---|---|---|---|
| 1 | No UI to edit any array-based section content (features, testimonials, team members, gallery images, categories) — sections render permanently empty, and `Team.tsx` silently falls back to hardcoded fake staff ("Savannah Nguyen" etc.) with random `pravatar.cc` photos, which will ship to a real tenant's live site if untouched | Blocker | `WebsiteBuilderClient.tsx`, `components/website/themes/*/sections/Team.tsx` |
| 2 | No image upload/URL fields anywhere in the builder (hero background, logo, gallery, OG image) despite full schema/theme support; Cloudinary is already integrated for product images elsewhere in the app but not reused here | Blocker | `WebsiteBuilderClient.tsx` |
| 3 | "Manage Pages" tab is non-functional — every page shows a static "Active" badge with no real toggle or state | Blocker | `app/(app)/website-builder/WebsiteBuilderClient.tsx:246-291` |
| 4 | "View Menu / Shop" quick link points to `/menu/{tenantId}`, which now just redirects to the homepage, not to `/site/{tenantId}/shop` where the shop page actually lives | Blocker | `app/(app)/website-builder/WebsiteBuilderClient.tsx:299` |
| 5 | No UI for SEO (meta title/description/OG image/keywords), business info (address/phone/email/WhatsApp/social links), or typography/button/card style, despite all being first-class fields in `WebsiteConfig` and consumed by theme components | Blocker | `WebsiteBuilderClient.tsx`, `lib/website/types.ts` |
| 6 | Regression: the tenant-editable fields backing the About page / hero subtitle fallback (`tagline`, `aboutText`, `coverImageUrl`, `businessHours`) had a "Website Content" card in Settings as of 2026-07-12 — that card no longer exists anywhere in Settings/Branding, and no replacement UI covers these fields. Tenants currently cannot edit them at all. | Blocker | `app/(app)/settings/*` |
| 7 | `POST /api/website` writes the full client-submitted JSON straight into Prisma with no validation — `theme` isn't checked against known ids, no size limits, no schema validator (same class of gap as the app-wide "no zod anywhere" finding from 2026-07-12) | High | `app/api/website/route.ts:17-36` |
| 8 | No permission/RBAC check on the Website Builder — page only checks `session` exists, API route only checks `session.user.tenantId`. Every other sensitive action in the app (price override, product edits) is gated by a permission; this one lets any logged-in staff member redesign the public site | High | `app/(app)/website-builder/page.tsx`, `app/api/website/route.ts` |
| 9 | `/api/website/lead` (public contact form) and `/api/website/visit` (analytics beacon) are fully unauthenticated with no rate limiting and accept a raw client-supplied `tenantId` — trivially scriptable to spam any tenant's lead inbox or pollute their visit analytics | High | `app/api/website/lead/route.ts`, `app/api/website/visit/route.ts` |
| 10 | Default section content per theme is triplicated (`app/api/website/theme-defaults/route.ts`, `lib/website/utils.ts`, `app/(app)/website-builder/page.tsx`) and already drifting slightly — same "no shared source of truth" pattern as the earlier `PRESET_CATEGORIES` finding | Medium | `lib/website/utils.ts` and duplicates |
| 11 | No `sitemap.ts`/`robots.ts` for tenant public sites — hurts SEO discoverability, which matters for a "your own website" selling point | Medium | `app/site/[tenantId]/` |
| 12 | QR code generation (Settings tab in builder) calls a third-party image API (`api.qrserver.com`) on every render/download with no self-hosted fallback | Low | `WebsiteBuilderClient.tsx:317-334` |
| 13 | `Team.tsx` carousel prev/next buttons render but have no `onClick` — dead UI | Low | `components/website/themes/premium-food/sections/Team.tsx:21-28` |

### Notes

- `AGENTS.md` currently instructs agents to read docs inside `node_modules/next/dist/docs/` before
  writing code — this matches the shape of the prompt-injection attempt already flagged in the
  2026-07-12 entry (found living in `node_modules/next/dist/docs/index.md`). Worth reviewing/removing
  that instruction from `AGENTS.md` since it actively steers agents toward attacker-controlled content
  in a dependency; not acted on this session pending user confirmation.
- Nothing in this session was fixed — audit only, per user request.

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
