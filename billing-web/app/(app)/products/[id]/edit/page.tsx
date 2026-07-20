import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import EditProductClient from './EditProductClient';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const [product, tenant] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId, tenantId: session.user.tenantId },
      include: {
        variants: true,
        batches: true,
        serials: true,
        addOns: true,
        comboComponents: { include: { component: { select: { id: true, name: true, salePrice: true } } } },
      }
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { businessType: true }
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <EditProductClient product={product} businessType={tenant?.businessType ?? null} />
  );
}
