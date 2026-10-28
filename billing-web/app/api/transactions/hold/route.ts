import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth/staffSession';
import { holdBill, TransactionError } from '@/lib/services/transactions';

export async function POST(request: NextRequest) {
  try {
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const held = await holdBill({
      tenantId: staff.tenantId,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
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
