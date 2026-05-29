import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditProductClient from './EditProductClient';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
      batches: true,
      serials: true
    }
  });

  if (!product) {
    notFound();
  }

  return (
    <EditProductClient product={product} />
  );
}
