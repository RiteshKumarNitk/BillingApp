import { CartProvider } from '@/components/website/CartContext';
import { CartDrawer, AuthModal, OrderSuccessToast } from '@/components/website/CartComponents';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import type { Metadata } from 'next';

// Set once here (rather than duplicated in every page's own generateMetadata) since it's the same
// value across the whole site and Next.js merges layout-level metadata into every child page's.
export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
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

  // resolveTenant is React-cache()'d, so this is deduped against each page's own lookup for the
  // same tenantId within the request — not a second DB round trip in practice. Needed so the cart
  // drawer/auth modal (rendered here, outside any theme Layout's DOM subtree) can still pick up
  // the tenant's real brand color instead of a hardcoded gray.
  const tenant = await resolveTenant(tenantId);
  const primaryColor = tenant ? getWebsiteConfig(tenant).appearance?.colors?.primary : undefined;

  return (
    <CartProvider tenantId={tenantId}>
      {children}
      <CartDrawer tenant={tenant || {}} primaryColor={primaryColor} />
      <AuthModal primaryColor={primaryColor} />
      <OrderSuccessToast />
    </CartProvider>
  );
}
