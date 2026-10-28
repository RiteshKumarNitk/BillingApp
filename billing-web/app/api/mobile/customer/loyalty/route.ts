import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerIdFromAuthHeader } from '@/lib/auth/customer-mobile';
import { LOYALTY_EARN_RATE, LOYALTY_POINT_VALUE } from '@/lib/loyalty';
import { log } from '@/lib/logger';

// The signed-in customer's loyalty balance at every cafe they've ordered from. Points live on the
// per-cafe Customer row linked to this app account (each cafe runs its own balance). Rules come
// from lib/loyalty.ts so the app never hard-codes a rate.
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.customer.findMany({
      where: { customerAccountId },
      select: {
        loyaltyPoints: true,
        totalSpent: true,
        lastPurchaseDate: true,
        tenant: { select: { id: true, name: true, logoUrl: true, websiteSlug: true, status: true } },
      },
      orderBy: { loyaltyPoints: 'desc' },
      take: 200,
    });

    const cafes = rows
      .filter((r) => r.tenant.status === 'ACTIVE')
      .map((r) => ({
        tenantId: r.tenant.id,
        cafeName: r.tenant.name,
        logoUrl: r.tenant.logoUrl,
        slug: r.tenant.websiteSlug || r.tenant.id,
        points: r.loyaltyPoints,
        valueRupees: r.loyaltyPoints * LOYALTY_POINT_VALUE,
        totalSpent: Math.round(r.totalSpent * 100) / 100,
        lastVisit: r.lastPurchaseDate,
      }));

    return NextResponse.json({
      cafes,
      totalPoints: cafes.reduce((s, c) => s + c.points, 0),
      rules: {
        earnRupeesPerPoint: LOYALTY_EARN_RATE,
        pointValueRupees: LOYALTY_POINT_VALUE,
        // Redemption exists at the cafe's counter (POS) only; online checkout has no redeem step yet.
        redeemAt: 'COUNTER',
      },
    });
  } catch (error) {
    log.error('loyalty.fetch_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
