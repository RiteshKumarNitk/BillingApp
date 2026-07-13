import { getMenuTenant } from './data';
import MenuShell from './MenuShell';

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenant = await getMenuTenant(tenantId);

  return (
    <MenuShell tenantId={tenantId} tenant={tenant}>
      {children}
    </MenuShell>
  );
}
