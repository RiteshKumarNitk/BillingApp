// Single source for the brand literals repeated across every marketing page/component. A future
// rename touches this file (plus the Navbar logo mark) instead of ~20 hardcoded strings.
export const BRAND_NAME = "CafeOS";
export const BRAND_TAGLINE = "The Complete Cafe Management Platform";

// The indigo->violet gradient is the one visual motif repeated (as literal Tailwind classes) in
// every landing/marketing component — centralized here so a re-theme is a one-file change.
export const GRADIENT_TEXT = "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent";
export const GRADIENT_BG = "bg-gradient-to-r from-indigo-600 to-violet-600";
export const GRADIENT_BG_HOVER = "hover:from-indigo-500 hover:to-violet-500";

export const EYEBROW_CLASS =
  "mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700";
