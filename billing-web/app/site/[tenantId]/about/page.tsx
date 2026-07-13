import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import SitePageShell from '@/components/website/SitePageShell';
import AboutContent from './AboutContent';

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) return { title: 'About - Not Found' };
  return { title: `About ${tenant.name}`, description: tenant.aboutText || `Learn more about ${tenant.name}` };
}

export default async function AboutPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) notFound();

  const config = getWebsiteConfig(tenant);

  return (
    <SitePageShell config={config} tenant={tenant}>
      <AboutContent config={config} tenant={tenant} />
    </SitePageShell>
  );
}
