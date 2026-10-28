// The public storefront (/site/[tenantId]/*) renders through client components, and React
// serializes every client-component prop into the page HTML. Passing the raw Prisma rows there
// published, to every anonymous visitor, fields that must never leave the server: the owner's
// Aadhaar document URL, GSTIN, subscription/status internals, and each product's purchase price
// (cost), barcode and batch data. Everything handed to a storefront component must go through
// these projections — they list exactly the fields the storefront renders, nothing else.

// Prisma `select` for storefront product reads (also bounds the payload: no cost/batch/serial data).
export const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  category: true,
  salePrice: true,
  mrp: true,
  productType: true,
  // Shown as in-stock / sold-out; createCustomerOrder re-validates server-side at checkout.
  stock: true,
  inventoryMode: true,
  isFeatured: true,
  isAvailable: true,
  foodType: true,
  durationMinutes: true,
  variants: { select: { id: true, name: true, salePrice: true, mrp: true, stock: true } },
  comboComponents: {
    select: {
      quantity: true,
      component: { select: { name: true } },
      componentVariant: { select: { name: true } },
    },
  },
} as const;

// Items the cafe has switched off are not shown on the storefront (matches the mobile store-menu
// API; previously the website listed them and checkout then rejected them).
export const PUBLIC_PRODUCT_WHERE = { isAvailable: true } as const;

const PUBLIC_TENANT_FIELDS = [
  'id', 'name', 'websiteSlug', 'businessType', 'tagline', 'aboutText', 'logoUrl', 'coverImageUrl',
  'shopFrontImageUrl', 'ownerImageUrl', 'primaryColor', 'fontFamily', 'menuTheme', 'currency',
  'phone', 'email', 'address', 'landmark', 'city', 'state', 'country', 'postalCode',
  'latitude', 'longitude', 'businessHours',
] as const;

type NumericField = 'latitude' | 'longitude';
export type PublicSiteTenant =
  { id: string; name: string } &
  Record<Exclude<(typeof PUBLIC_TENANT_FIELDS)[number], 'id' | 'name' | NumericField>, string | null> &
  Record<NumericField, number | null> & {
    // The tenant's own published site config (lib/website/types.ts WebsiteConfig rows) and the
    // PUBLIC_PRODUCT_SELECT product rows; consumed by untyped storefront components.
    websiteSettings: unknown;
    products?: unknown[];
  };

export function toPublicSiteTenant(tenant: Record<string, unknown> | null | undefined): PublicSiteTenant {
  const out: Record<string, unknown> = {};
  for (const field of PUBLIC_TENANT_FIELDS) out[field] = tenant?.[field] ?? null;
  // The website config is the tenant's own published site content — public by design.
  out.websiteSettings = tenant?.websiteSettings ?? null;
  if (Array.isArray(tenant?.products)) out.products = tenant.products;
  return out as PublicSiteTenant;
}
