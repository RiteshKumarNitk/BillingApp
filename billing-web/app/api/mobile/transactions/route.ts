import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { tenantId: user.tenantId },
        include: {
          items: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { tenantId: user.tenantId } }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Mobile transactions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, discount } = await request.json();

    if (!items || !items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const discountValue = parseFloat(discount) || 0;

    let subtotal = 0;
    const transactionItemsData = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.salePrice) || 0;
      const itemTotal = price * qty;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        name: item.name,
        barcode: item.barcode || 'N/A',
        purchasePrice: parseFloat(item.purchasePrice) || 0,
        mrp: parseFloat(item.mrp) || 0,
        salePrice: price,
        quantity: qty,
        itemTotal,
      };
    });

    const netAmount = Math.max(0, subtotal - discountValue);

    const transaction = await prisma.$transaction(async (tx: any) => {
      const newTransaction = await tx.transaction.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          totalAmount: subtotal,
          discount: discountValue,
          netAmount,
          items: { create: transactionItemsData },
        },
        include: { items: true }
      });

      for (const item of transactionItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newTransaction;
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile transactions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
