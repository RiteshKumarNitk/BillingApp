import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { listHeldBills } from '@/lib/services/transactions';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const heldBills = await listHeldBills(token.tenantId as string);

    return NextResponse.json({ heldBills });
  } catch (error: any) {
    console.error('List held bills error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
