import { cache } from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Wrapped in React's cache() so layout.tsx and each page.tsx can independently call this without
// issuing duplicate DB round-trips within the same request — the standard App Router pattern for
// data a layout and its pages both need.
export const getMenuTenant = cache(async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true, address: true, phone: true, menuTheme: true, latitude: true, longitude: true,
      logoUrl: true, tagline: true, aboutText: true, coverImageUrl: true, businessHours: true,
    }
  });
  if (!tenant) notFound();
  return tenant;
});

export type MenuTenant = Awaited<ReturnType<typeof getMenuTenant>>;
