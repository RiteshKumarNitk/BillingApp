import { NextRequest, NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/auth/staffSession';
import { createTransaction, TransactionError } from '@/lib/services/transactions';
import { isDatabaseBusyError, DB_BUSY_RESPONSE } from '@/lib/dbErrors';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const staff = await getStaffSession();

    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const transaction = await createTransaction({
      tenantId: staff.tenantId,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
      items: body.items,
      discount: body.discount,
      taxAmount: body.taxAmount,
      paymentMethod: body.paymentMethod,
      amountReceived: body.amountReceived,
      changeAmount: body.changeAmount,
      payments: body.payments,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      notes: body.notes,
      couponCode: body.couponCode,
      loyaltyPointsRedeemed: body.loyaltyPointsRedeemed,
      tableNumber: body.tableNumber,
      orderType: body.orderType,
      // Header is the standard place; body is accepted too for simple fetch callers.
      idempotencyKey: request.headers.get('idempotency-key') || body.idempotencyKey || null,
    });

    return NextResponse.json(
      {
        message: 'Transaction created successfully',
        transaction
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof TransactionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    // Pool saturated / DB unreachable: transient, and the client's idempotency key makes a retry
    // safe — answer 503 + Retry-After instead of a crash-looking 500.
    if (isDatabaseBusyError(error)) {
      log.warn('pos.checkout_db_busy', { error });
      return NextResponse.json(DB_BUSY_RESPONSE.body, DB_BUSY_RESPONSE.init);
    }
    log.error('pos.checkout_failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
