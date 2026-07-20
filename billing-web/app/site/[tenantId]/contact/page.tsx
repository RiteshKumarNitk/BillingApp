import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import SitePageShell from '@/components/website/SitePageShell';
import PageDisabled from '@/components/website/PageDisabled';
import ContactContent from './ContactContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) return { title: 'Contact - Not Found' };
  const config = getWebsiteConfig(tenant);
  if (config.pages?.contact === false) return { title: 'Contact - Not Found', robots: { index: false, follow: false } };
  return { title: `Contact ${tenant.name}`, description: `Get in touch with ${tenant.name}` };
}

export default async function ContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) notFound();

  const config = getWebsiteConfig(tenant);

  if (config.pages?.contact === false) {
    return (
      <SitePageShell config={config} tenant={tenant}>
        <PageDisabled label="Contact" />
      </SitePageShell>
    );
  }

  return (
    <SitePageShell config={config} tenant={tenant}>
      <ContactContent config={config} tenant={tenant} />
    </SitePageShell>
  );
}
