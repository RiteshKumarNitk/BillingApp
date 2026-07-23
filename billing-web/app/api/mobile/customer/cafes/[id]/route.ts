import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/website/utils';
import { toPublicCafe } from '@/lib/cafes/cafePublicFields';

// Single-cafe detail — the list route (GET /cafes) never had a by-id lookup, needed by the QR
// scanner (scan -> resolve table -> need the full cafe object, not just a search hit) and by
// deep-linking into a cafe from Search/Favourites/Recently-Visited. Public, no auth, same as the
// list route — accepts either the raw tenant id or its websiteSlug via resolveTenant().
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenant = await resolveTenant(id);
    if (!tenant || tenant.status !== 'ACTIVE' || tenant.businessType !== 'CAFE' || !tenant.websiteSettings) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        code: null,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      select: { id: true, name: true, discountPercentage: true, applicableCategory: true, minimumQuantity: true },
    });

    const cafe = toPublicCafe({
      id: tenant.id,
      name: tenant.name,
      websiteSlug: tenant.websiteSlug,
      tagline: tenant.tagline,
      logoUrl: tenant.logoUrl,
      coverImageUrl: tenant.coverImageUrl,
      address: tenant.address,
      latitude: tenant.latitude,
      longitude: tenant.longitude,
      businessHours: tenant.businessHours,
      aboutText: tenant.aboutText,
      email: tenant.email,
      phone: tenant.phone,
      websiteSettings: tenant.websiteSettings
        ? { theme: tenant.websiteSettings.theme, appearance: tenant.websiteSettings.appearance }
        : null,
    });

    return NextResponse.json({ cafe: { ...cafe, activeDiscounts: discounts } });
  } catch (error) {
    console.error('Error fetching cafe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
