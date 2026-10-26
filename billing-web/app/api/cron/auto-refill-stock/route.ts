import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

// Resets every AUTO_REFILL product's stock back to its configured autoRefillQuantity once per
// day — meant to run once daily (e.g. 00:00 UTC via the hosting platform's cron scheduler,
// matching app/api/cron/dunning's convention). No per-tenant timezone awareness yet: a single
// fixed run time is a reasonable first pass since "start of day" only needs to be approximately
// right for a daily batch reset, not exact to the minute.
//
// Can't use a single `data: { stock: autoRefillQuantity }` update since the target value differs
// per row — fetch the (typically small) set of AUTO_REFILL products and update each individually.
export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const autoRefillProducts = await prisma.product.findMany({
      where: { inventoryMode: 'AUTO_REFILL', autoRefillQuantity: { not: null } },
      select: { id: true, autoRefillQuantity: true },
    });

    await Promise.all(
      autoRefillProducts.map((p) =>
        prisma.product.update({ where: { id: p.id }, data: { stock: p.autoRefillQuantity! } })
      )
    );

    return NextResponse.json({ success: true, refilled: autoRefillProducts.length });
  } catch (error: any) {
    console.error('Auto-refill cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
