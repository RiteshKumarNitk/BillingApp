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
    const updatePromises = products.map((product: any) => {
      return prisma.product.update({
        where: { 
          id: product.id,
          tenantId: session.user.tenantId // Ensure they only update their own products
        },
        data: {
          stock: parseInt(product.stock, 10),
          purchasePrice: parseFloat(product.purchasePrice),
          mrp: parseFloat(product.mrp),
          salePrice: parseFloat(product.salePrice),
        }
      });
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
