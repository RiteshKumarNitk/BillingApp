import { cache } from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

const tenantSelect = {
  id: true, name: true, address: true, phone: true, menuTheme: true, latitude: true, longitude: true,
  logoUrl: true, tagline: true, aboutText: true, coverImageUrl: true, businessHours: true, websiteSlug: true,
} as const;

export const getMenuTenant = cache(async (tenantId: string) => {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: tenantId },
        { websiteSlug: tenantId },
        { website: tenantId },
        { domain: tenantId },
      ],
    },
    select: tenantSelect,
  });
  if (!tenant) notFound();
  return tenant;
});

export type MenuTenant = Awaited<ReturnType<typeof getMenuTenant>>;
