import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';
import { createTransaction, TransactionError } from '@/lib/services/transactions';

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
    const mobileUser = getMobileUserFromAuthHeader(request);
    if (!mobileUser || !mobileUser.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    let permissions: string[] = [];
    if (mobileUser.tenantRole) {
      const roleRecord = await prisma.role.findUnique({ where: { id: mobileUser.tenantRole as string } });
      permissions = roleRecord?.permissions || [];
    }

    const body = await request.json();

    const transaction = await createTransaction({
      tenantId: mobileUser.tenantId as string,
      userId: mobileUser.id as string,
      role: mobileUser.role as string,
      permissions,
      items: body.items,
      discount: body.discount,
      taxAmount: body.taxAmount,
      paymentMethod: body.paymentMethod,
      amountReceived: body.amountReceived,
      changeAmount: body.changeAmount,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      notes: body.notes,
    });

    return corsResponse({ transaction }, { status: 201 });
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return corsResponse({ error: error.message }, { status: error.status });
    }
    console.error('Mobile transactions POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
