import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { cafePublicSelect, toPublicCafe, haversineKm } from '@/lib/cafes/cafePublicFields';

// Cafe discovery/browse for the CafeOS customer mobile app — public, no auth (matches every other
// "discover before you commit to an account" flow in the app; browsing is guest-friendly, only
// checkout requires login). Query params: `lat`/`lng` (optional — sorts by distance and includes
// `distanceKm` when given), `search` (optional, matches name/tagline/address/city/state), `sort` (optional,
// `popular` ranks by real historical order volume instead of newest-first/distance), `limit`
// (default 30, max 100).
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`mobile-cafes:${ip}`, 60, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
    const search = (searchParams.get('search') || '').trim();
    const sort = searchParams.get('sort') || '';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10) || 30, 1), 100);

    const where: any = {
      status: 'ACTIVE',
      businessType: 'CAFE',
      websiteSettings: { isNot: null },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sort === 'popular') {
      // Real signal, not a fabricated rating: rank by completed-order volume. Rejected orders don't
      // count as "popularity"; everything else (pending/preparing/completed) does.
      const tenants = await prisma.tenant.findMany({
        where,
        select: {
          ...cafePublicSelect,
          _count: { select: { orderRequests: { where: { status: { not: 'REJECTED' } } } } },
        },
        take: limit * 3, // over-fetch pre-sort, same shape as the distance path below
      });
      const cafes = tenants
        .sort((a, b) => b._count.orderRequests - a._count.orderRequests)
        .slice(0, limit)
        .map((t) => ({ ...toPublicCafe(t), _count: undefined, distanceKm: null as number | null }));
      return NextResponse.json({ cafes });
    }

    const tenants = await prisma.tenant.findMany({
      where,
      select: cafePublicSelect,
      take: hasLocation ? 500 : limit, // over-fetch when sorting by distance in app code, then slice
      orderBy: hasLocation ? undefined : { createdAt: 'desc' },
    });

    let cafes = tenants.map((t) => ({ ...toPublicCafe(t), distanceKm: null as number | null }));
    if (hasLocation) {
      cafes = cafes
        .map((t) => ({
          ...t,
          distanceKm: t.latitude != null && t.longitude != null ? haversineKm(lat, lng, t.latitude, t.longitude) : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        .slice(0, limit);
    }

    return NextResponse.json({ cafes });
  } catch (error) {
    console.error('Error listing cafes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
