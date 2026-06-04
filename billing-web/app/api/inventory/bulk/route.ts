import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    // Verify all variants belong to the user's tenant via their parent product
    const variantItems = products.filter((item: any) => item.type === 'variant');
    const variantIds = variantItems.map((item: any) => item.id);

    if (variantIds.length > 0) {
      const ownedVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { tenantId: true } } }
      });
      
      // Check if all variant IDs were found
      if (ownedVariants.length !== variantIds.length) {
        return NextResponse.json({ error: 'One or more variants not found' }, { status: 404 });
      }
      
      for (const v of ownedVariants) {
        if (v.product.tenantId !== session.user.tenantId) {
          return NextResponse.json({ error: 'Unauthorized: Variant does not belong to your tenant' }, { status: 403 });
        }
      }
    }

    // We use a transaction to ensure all updates succeed or fail together
    const updatePromises = products.map((item: any) => {
      const data = {
        stock: parseFloat(item.stock),
        purchasePrice: parseFloat(item.purchasePrice),
        mrp: parseFloat(item.mrp),
        salePrice: parseFloat(item.salePrice),
      };

      if (item.type === 'variant') {
        return prisma.productVariant.update({
          where: { id: item.id },
          data
        });
      } else {
        return prisma.product.update({
          where: { 
            id: item.id,
            tenantId: session.user.tenantId
          },
          data
        });
      }
    });

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true, count: products.length });
  } catch (error: any) {
    console.error('Bulk inventory update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
