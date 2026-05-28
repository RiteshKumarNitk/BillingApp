import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { tenantId: user.tenantId },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ transactions });
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
      const itemTotal = item.salePrice * item.quantity;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        name: item.name,
        barcode: item.barcode || 'N/A',
        purchasePrice: item.purchasePrice || 0,
        mrp: item.mrp || 0,
        salePrice: item.salePrice,
        quantity: item.quantity,
        itemTotal: itemTotal,
      };
    });

    const netAmount = subtotal - discountValue;

    // Use transaction to ensure stock is updated correctly
    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          totalAmount: subtotal,
          discount: discountValue,
          netAmount: netAmount,
          items: {
            create: transactionItemsData,
          }
        },
        include: { items: true }
      });

      // 2. Update stock
      for (const item of transactionItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
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
