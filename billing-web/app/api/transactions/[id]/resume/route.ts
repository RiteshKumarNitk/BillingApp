import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { resumeBill, TransactionError } from '@/lib/services/transactions';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const transaction = await resumeBill({
      transactionId: id,
      tenantId: token.tenantId as string,
      userId: token.id as string,
      role: token.role as string,
      permissions: (token.permissions as string[]) || [],
      paymentMethod: body.paymentMethod,
      amountReceived: body.amountReceived,
      changeAmount: body.changeAmount,
      payments: body.payments,
    });

    return NextResponse.json({ message: 'Bill resumed', transaction }, { status: 201 });
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Resume bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
