import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { generateSlug, isValidUuid } from '@/lib/website/slug';

export default async function ShortSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let tenantId: string | null = null;

  if (isValidUuid(slug)) {
    tenantId = slug;
  } else {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { website: slug },
          { domain: slug },
        ]
      },
      select: { id: true }
    });
    if (tenant) {
      tenantId = tenant.id;
    }
  }

  if (!tenantId) {
    const tenantByName = await prisma.tenant.findFirst({
      where: { name: { contains: slug, mode: 'insensitive' } },
      select: { id: true }
    });
    if (tenantByName) {
      tenantId = tenantByName.id;
    }
  }

  if (!tenantId) {
    redirect('/');
  }

  redirect(`/site/${tenantId}`);
}
