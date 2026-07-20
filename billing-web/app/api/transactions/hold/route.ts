import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { holdBill, TransactionError } from '@/lib/services/transactions';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const held = await holdBill({
      tenantId: token.tenantId as string,
      userId: token.id as string,
      role: token.role as string,
      permissions: (token.permissions as string[]) || [],
      items: body.items,
      discount: body.discount,
      taxAmount: body.taxAmount,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      notes: body.notes,
      couponCode: body.couponCode,
      loyaltyPointsRedeemed: body.loyaltyPointsRedeemed,
      tableNumber: body.tableNumber,
      orderType: body.orderType,
    });

    return NextResponse.json({ message: 'Bill held', transaction: held }, { status: 201 });
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Hold bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
