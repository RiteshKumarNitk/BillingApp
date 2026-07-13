import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import SitePageShell from '@/components/website/SitePageShell';
import ContactContent from './ContactContent';

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) return { title: 'Contact - Not Found' };
  return { title: `Contact ${tenant.name}`, description: `Get in touch with ${tenant.name}` };
}

export default async function ContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) notFound();

  const config = getWebsiteConfig(tenant);

  return (
    <SitePageShell config={config} tenant={tenant}>
      <ContactContent config={config} tenant={tenant} />
    </SitePageShell>
  );
}
