import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import SitePageShell from '@/components/website/SitePageShell';
import ContactContent from './ContactContent';

export default async function ContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) return <div className="p-8 text-center text-red-500">Tenant not found</div>;

  const config = getWebsiteConfig(tenant);

  return (
    <SitePageShell config={config} tenant={tenant}>
      <ContactContent config={config} tenant={tenant} />
    </SitePageShell>
  );
}
