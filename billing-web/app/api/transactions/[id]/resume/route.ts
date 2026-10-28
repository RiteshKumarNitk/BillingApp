import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth/staffSession';
import { resumeBill, TransactionError } from '@/lib/services/transactions';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const transaction = await resumeBill({
      transactionId: id,
      tenantId: staff.tenantId,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
      paymentMethod: body.paymentMethod,
      amountReceived: body.amountReceived,
      changeAmount: body.changeAmount,
      payments: body.payments,
      customerPhone: body.customerPhone,
      customerName: body.customerName,
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
