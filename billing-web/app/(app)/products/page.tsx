import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductsListClient from './ProductsListClient';

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { businessType: true },
  });

  return <ProductsListClient businessType={tenant?.businessType ?? null} />;
}
