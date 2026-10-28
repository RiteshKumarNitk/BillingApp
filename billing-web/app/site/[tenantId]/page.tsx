import React from 'react';
import WebsiteRenderer from '@/components/website/WebsiteRenderer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedPublicSite, getWebsiteConfig } from '@/lib/website/utils';
import { toPublicSiteTenant } from '@/lib/website/publicTenant';

export const dynamic = 'force-dynamic';

interface SitePageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = await getCachedPublicSite(resolvedParams.tenantId);

  if (!tenant) {
    return { title: 'Site Not Found' };
  }

  if (!tenant.websiteSettings) {
    return { title: tenant.name, description: tenant.aboutText || `${tenant.name} - Built with BillingApp` };
  }

  const config = getWebsiteConfig(tenant);
  const title = config.seo?.metaTitle || tenant.name;
  const description = config.seo?.metaDescription || tenant.aboutText || `${tenant.name} - Built with BillingApp`;

  return {
    title,
    description,
    keywords: config.seo?.keywords || undefined,
    alternates: config.seo?.canonicalUrl ? { canonical: config.seo.canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      images: config.seo?.ogImageUrl ? [{ url: config.seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const resolvedParams = await params;
  const tenant = await getCachedPublicSite(resolvedParams.tenantId);

  if (!tenant) {
    notFound();
  }

  const config = getWebsiteConfig(tenant);

  return (
    <WebsiteRenderer config={config} tenant={toPublicSiteTenant(tenant)} />
  );
}
