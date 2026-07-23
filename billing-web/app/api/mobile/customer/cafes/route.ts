import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Cafe discovery/browse for the CafeOS customer mobile app — public, no auth (matches every other
// "discover before you commit to an account" flow in the app; browsing is guest-friendly, only
// checkout requires login). This is the one capability with no prior art anywhere in the codebase —
// every existing customer-facing route assumes the caller already knows which tenant they want
// (via slug/QR/link). Query params: `lat`/`lng` (optional — sorts by distance and includes
// `distanceKm` when given), `search` (optional, matches name/tagline/address), `limit` (default 30,
// max 100).
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
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        name: true,
        websiteSlug: true,
        tagline: true,
        logoUrl: true,
        coverImageUrl: true,
        address: true,
        latitude: true,
        longitude: true,
        businessHours: true,
        // Tenant.primaryColor/fontFamily are dead legacy fields never touched by the Website
        // Builder save route — the real per-cafe branding lives in Website.appearance (the Theme
        // Engine), so that's what a client needs to actually re-theme a screen to match this cafe.
        websiteSettings: { select: { theme: true, appearance: true } },
      },
      take: hasLocation ? 500 : limit, // over-fetch when sorting by distance in app code, then slice
      orderBy: hasLocation ? undefined : { createdAt: 'desc' },
    });

    let cafes = tenants.map((t) => ({
      ...t,
      theme: t.websiteSettings?.theme ?? null,
      appearance: t.websiteSettings?.appearance ?? null,
      websiteSettings: undefined,
      distanceKm: null as number | null,
    }));
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
