import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { resolveTenant } from '@/lib/website/utils';

// Public, unauthenticated: resolves a table QR token to its display label only (never anything
// sensitive) so the ordering UI can show "Ordering for Table 5" after a customer scans a QR code.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`table-lookup:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const tenantIdOrSlug = searchParams.get('tenantId');
  const token = searchParams.get('token');
  if (!tenantIdOrSlug || !token) {
    return NextResponse.json({ error: 'tenantId and token are required' }, { status: 400 });
  }

  // tenantId here is whatever segment the customer's URL used (uuid or websiteSlug) — resolve it
  // the same way the site pages do, matching /api/customer/orders' handling of the same value.
  const tenant = await resolveTenant(tenantIdOrSlug);
  const table = await prisma.table.findUnique({ where: { qrToken: token } });
  if (!tenant || !table || table.tenantId !== tenant.id || !table.isActive) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, label: table.label });
}
