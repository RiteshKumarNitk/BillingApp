import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { generateSlug, isValidUuid } from '@/lib/website/slug';

export default async function ShortSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let finalRoute: string | null = null;

  if (isValidUuid(slug)) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: slug },
      select: { id: true, websiteSlug: true }
    });
    if (tenant) {
      finalRoute = tenant.websiteSlug || tenant.id;
    }
  } else {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { websiteSlug: slug },
          { website: slug },
          { domain: slug },
        ]
      },
      select: { id: true, websiteSlug: true }
    });
    if (tenant) {
      finalRoute = tenant.websiteSlug || tenant.id;
    }
  }

  if (!finalRoute) {
    const tenantByName = await prisma.tenant.findFirst({
      where: { name: { contains: slug, mode: 'insensitive' } },
      select: { id: true, websiteSlug: true }
    });
    if (tenantByName) {
      finalRoute = tenantByName.websiteSlug || tenantByName.id;
    }
  }

  if (!finalRoute) {
    redirect('/');
  }

  redirect(`/site/${finalRoute}`);
}
