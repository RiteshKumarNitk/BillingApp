import React from 'react';
import WebsiteRenderer from '@/components/website/WebsiteRenderer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveTenantWithProducts, getWebsiteConfig } from '@/lib/website/utils';

interface SitePageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = await resolveTenantWithProducts(resolvedParams.tenantId);

  if (!tenant) {
    return { title: 'Site Not Found' };
  }

  if (!tenant.websiteSettings) {
    return { title: tenant.name, description: tenant.aboutText || `${tenant.name} - Built with BillingApp` };
  }

  const config = getWebsiteConfig(tenant);
  return {
    title: config.seo?.metaTitle || tenant.name,
    description: config.seo?.metaDescription || tenant.aboutText || `${tenant.name} - Built with BillingApp`,
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const resolvedParams = await params;
  const tenant = await resolveTenantWithProducts(resolvedParams.tenantId);

  if (!tenant) {
    notFound();
  }

  const config = getWebsiteConfig(tenant);

  return (
    <WebsiteRenderer config={config} tenant={tenant} />
  );
}
