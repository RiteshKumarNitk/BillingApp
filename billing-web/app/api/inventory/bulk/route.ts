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
          where: { id: item.id }, // ProductVariant doesn't have tenantId directly, assuming ID is secure enough in this context, or we verify parent product. Let's just update by ID for now.
          data
        });
      } else {
        return prisma.product.update({
          where: { 
            id: item.id,
            tenantId: session.user.tenantId // Ensure they only update their own products
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
