import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerIdFromAuthHeader } from '@/lib/auth/customer-mobile';
import { log } from '@/lib/logger';

// Single-order detail/tracking — the mobile customer API previously only had a 50-row list
// (GET /api/mobile/customer/orders), no way to fetch or poll one order by id.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.orderRequest.findUnique({
      where: { id },
      include: {
        items: true,
        tenant: { select: { name: true, logoUrl: true, address: true, phone: true } },
        table: { select: { label: true } },
      },
    });

    // Scoped to the requesting customer — never leak another customer's order by guessing an id.
    if (!order || order.customerAccountId !== customerAccountId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Customer-initiated cancel. Only while the cafe hasn't started on it (PENDING / ON_HOLD) — once
// accepted, food may already be in preparation, so the customer must contact the cafe. The
// update is a compare-and-set scoped to this customer, so a cancel racing the cafe's Accept can
// never both succeed (whichever commits first wins; the other sees 409).
const CUSTOMER_CANCELLABLE = ['PENDING', 'ON_HOLD'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'CANCEL') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const result = await prisma.orderRequest.updateMany({
      where: { id, customerAccountId, status: { in: CUSTOMER_CANCELLABLE } },
      data: { status: 'CANCELLED' },
    });

    if (result.count === 0) {
      const order = await prisma.orderRequest.findFirst({ where: { id, customerAccountId }, select: { status: true } });
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      if (order.status === 'CANCELLED') return NextResponse.json({ order: { id, status: 'CANCELLED' } }); // already done — idempotent
      return NextResponse.json(
        { error: 'The cafe has already started this order, so it can no longer be cancelled here. Please contact the cafe.' },
        { status: 409 }
      );
    }

    log.info('order.cancelled_by_customer', { orderId: id });
    return NextResponse.json({ order: { id, status: 'CANCELLED' } });
  } catch (error) {
    log.error('order.customer_cancel_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
