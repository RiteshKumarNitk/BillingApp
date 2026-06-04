import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
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

    return corsResponse({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Mobile transactions GET error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, discount, taxAmount, paymentMethod, amountReceived, changeAmount, customerId, customerName, customerPhone, notes } = await request.json();

    if (!items || !items.length) {
      return corsResponse({ error: 'No items provided' }, { status: 400 });
    }

    const discountValue = parseFloat(discount) || 0;

    let subtotal = 0;
    const transactionItemsData = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
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
        variantId: item.variantId || null,
        batchId: item.batchId || null,
        serialId: item.serialId || null,
      };
    });

    const taxValue = parseFloat(taxAmount) || 0;
    const netAmount = Math.max(0, subtotal - discountValue + taxValue);

    const transaction = await prisma.$transaction(async (tx: any) => {
      const newTransaction = await tx.transaction.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          totalAmount: subtotal,
          discount: discountValue,
          discountType: 'PERCENTAGE',
          taxAmount: taxValue,
          netAmount,
          paymentMethod: paymentMethod || null,
          amountReceived: amountReceived ? parseFloat(amountReceived) : null,
          changeAmount: changeAmount ? parseFloat(changeAmount) : null,
          customerId: customerId || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          notes: notes || null,
          items: { create: transactionItemsData },
        },
        include: { items: true }
      });

      for (const item of transactionItemsData) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          });
        } else if (item.batchId) {
          await tx.productBatch.update({
            where: { id: item.batchId },
            data: { stock: { decrement: item.quantity } }
          });
        } else if (item.serialId) {
          await tx.productSerial.update({
            where: { id: item.serialId },
            data: { status: 'SOLD' }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      return newTransaction;
    });

    return corsResponse({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile transactions POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
