import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { deleteHeldBill, TransactionError } from '@/lib/services/transactions';

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
