import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerIdFromAuthHeader } from '@/lib/auth/customer-mobile';

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
