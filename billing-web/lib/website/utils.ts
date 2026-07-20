import { cache } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import prisma from '@/lib/prisma';
import { getThemeDefaultConfig, DEFAULT_THEME_ID } from '@/lib/website/themeDefaults';

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
        products: { include: { variants: true }, where: { stock: { gt: -1 } } }
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
      products: { include: { variants: true }, where: { stock: { gt: -1 } } }
    }
  });
});

export function getTenantSiteUrl(tenant: any): string {
  return tenant.websiteSlug || tenant.id;
}
