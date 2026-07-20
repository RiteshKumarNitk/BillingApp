import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import SitePageShell from '@/components/website/SitePageShell';
import PageDisabled from '@/components/website/PageDisabled';
import AboutContent from './AboutContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) return { title: 'About - Not Found' };
  const config = getWebsiteConfig(tenant);
  if (config.pages?.about === false) return { title: 'About - Not Found', robots: { index: false, follow: false } };
  return { title: `About ${tenant.name}`, description: tenant.aboutText || `Learn more about ${tenant.name}` };
}

export default async function AboutPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);
  if (!tenant) notFound();

  const config = getWebsiteConfig(tenant);

  if (config.pages?.about === false) {
    return (
      <SitePageShell config={config} tenant={tenant}>
        <PageDisabled label="About" />
      </SitePageShell>
    );
  }

  return (
    <SitePageShell config={config} tenant={tenant}>
      <AboutContent config={config} tenant={tenant} />
    </SitePageShell>
  );
}
