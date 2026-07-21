import { CartProvider } from '@/components/website/CartContext';
import { CartDrawer, AuthModal, OrderSuccessToast } from '@/components/website/CartComponents';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';

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
