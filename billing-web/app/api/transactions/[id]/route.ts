import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth/staffSession';
import { deleteHeldBill, editTransaction, TransactionError } from '@/lib/services/transactions';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const transaction = await editTransaction({
      transactionId: id,
      tenantId: staff.tenantId,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
      items: body.items,
      notes: body.notes,
      reason: body.reason,
    });

    return NextResponse.json({ message: 'Invoice updated', transaction });
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Edit transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteHeldBill(
      id,
      staff.tenantId,
      staff.role,
      staff.permissions
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Delete held bill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
