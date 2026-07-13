import { CartProvider } from '@/components/website/CartContext';
import { CartDrawer, AuthModal, OrderSuccessToast } from '@/components/website/CartComponents';

export default async function SiteLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  
  return (
    <CartProvider tenantId={tenantId}>
      {children}
      <CartDrawer tenant={{}} />
      <AuthModal />
      <OrderSuccessToast />
    </CartProvider>
  );
}
