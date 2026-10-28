import { cache } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import prisma from '@/lib/prisma';
import { getThemeDefaultConfig, DEFAULT_THEME_ID } from '@/lib/website/themeDefinitions';
import { PUBLIC_PRODUCT_SELECT, PUBLIC_PRODUCT_WHERE, toPublicSiteTenant } from "@/lib/website/publicTenant";
import { cachedPublic } from "@/lib/publicCache";

export function getWebsiteConfig(tenant: any): WebsiteConfig {
  const settings = tenant.websiteSettings as WebsiteConfig | null;
  return settings || getThemeDefaultConfig(DEFAULT_THEME_ID, tenant);
}

export const resolveTenant = cache(async (tenantId: string) => {
  const { isValidUuid } = await import('./slug');

  if (isValidUuid(tenantId)) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { websiteSettings: true }
    });
  }

  return prisma.tenant.findFirst({
    where: {
      OR: [
        { websiteSlug: tenantId },
        { website: tenantId },
        { domain: tenantId },
      ]
    },
    include: { websiteSettings: true }
  });
});

export const resolveTenantWithProducts = cache(async (tenantId: string) => {
  const { isValidUuid } = await import('./slug');

  if (isValidUuid(tenantId)) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        websiteSettings: true,
        products: { select: PUBLIC_PRODUCT_SELECT, where: PUBLIC_PRODUCT_WHERE, orderBy: { name: "asc" } }
      }
    });
  }

  return prisma.tenant.findFirst({
    where: {
      OR: [
        { websiteSlug: tenantId },
        { website: tenantId },
        { domain: tenantId },
      ]
    },
    include: {
      websiteSettings: true,
      products: { select: PUBLIC_PRODUCT_SELECT, where: PUBLIC_PRODUCT_WHERE, orderBy: { name: "asc" } }
    }
  });
});

export function getTenantSiteUrl(tenant: any): string {
  return tenant.websiteSlug || tenant.id;
}

// Phase 9: the public storefront's tenant + menu, already reduced to its public projection, from
// the short-TTL public cache. Shared by the /site layout, metadata and home page, so a cache hit
// costs zero database queries per anonymous page view. Never use this where a fresh read matters
// (tenant status for ordering, stock checks) — use resolveTenant / the order service there.
export function getCachedPublicSite(tenantIdOrSlug: string) {
  return cachedPublic(`site:${tenantIdOrSlug}`, async () => {
    const tenant = await resolveTenantWithProducts(tenantIdOrSlug);
    return tenant ? toPublicSiteTenant(tenant) : null;
  });
}
