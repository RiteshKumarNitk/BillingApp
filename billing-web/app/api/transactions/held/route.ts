import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth/staffSession';
import { listHeldBills } from '@/lib/services/transactions';

export async function GET(request: NextRequest) {
  try {
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const heldBills = await listHeldBills(staff.tenantId);

    return NextResponse.json({ heldBills });
  } catch (error: any) {
    console.error('List held bills error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
