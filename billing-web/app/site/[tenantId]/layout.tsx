import { CartProvider } from '@/components/website/CartContext';
import { CartDrawer, AuthModal, OrderSuccessToast } from '@/components/website/CartComponents';
import { getCachedPublicSite, getWebsiteConfig } from '@/lib/website/utils';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { toPublicSiteTenant } from '@/lib/website/publicTenant';

// Set once here (rather than duplicated in every page's own generateMetadata) since it's the same
// value across the whole site and Next.js merges layout-level metadata into every child page's.
// notFound() is called here (in the metadata phase) as well as in the body below — see the body
// comment; this is the earliest point in the request that can force a genuine 404 status.
export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await getCachedPublicSite(tenantId);
  if (!tenant) {
    notFound();
  }
  const faviconUrl = tenant ? getWebsiteConfig(tenant).seo?.faviconUrl : undefined;
  return faviconUrl ? { icons: { icon: faviconUrl } } : {};
}

export default async function SiteLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // Served from the short-TTL public cache shared with the page and metadata (getCachedPublicSite),
  // so this is not an extra DB round trip. Needed so the cart
  // drawer/auth modal (rendered here, outside any theme Layout's DOM subtree) can still pick up
  // the tenant's real brand color instead of a hardcoded gray.
  const tenant = await getCachedPublicSite(tenantId);
  // A nonexistent tenant must be a real 404, not a 200 with placeholder content. This layout
  // level is the single choke point for every /site/[tenantId]/* route (page-level notFound()
  // calls were verified to return 200 in this Next.js install — see the 2026-07-20 audit).
  if (!tenant) {
    notFound();
  }
  const primaryColor = tenant ? getWebsiteConfig(tenant).appearance?.colors?.primary : undefined;

  return (
    <CartProvider tenantId={tenantId}>
      {children}
      {/* Profile only — the cached site entry also carries the full menu, which must not be
          serialized into every page's cart drawer (it tripled About/Contact page size). */}
      <CartDrawer tenant={toPublicSiteTenant({ ...tenant, products: undefined })} primaryColor={primaryColor} />
      <AuthModal primaryColor={primaryColor} />
      <OrderSuccessToast />
    </CartProvider>
  );
}
