import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { deleteHeldBill, editTransaction, TransactionError } from '@/lib/services/transactions';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const transaction = await editTransaction({
      transactionId: id,
      tenantId: token.tenantId as string,
      userId: token.id as string,
      role: token.role as string,
      permissions: (token.permissions as string[]) || [],
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
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteHeldBill(
      id,
      token.tenantId as string,
      token.role as string,
      (token.permissions as string[]) || []
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
