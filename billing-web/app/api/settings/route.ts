import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Optional: Only allow users with MANAGE_USERS or a specific setting permission to update tenant settings.
    // We'll use MANAGE_USERS for now, which is typically assigned to Owners.
    const isAuthorized = await hasPermission('MANAGE_USERS');
    if (!isAuthorized && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const {
      name, contactPerson, email, phone, address, gstin, website, currency, timezone, businessType,
      landmark, city, state, country, postalCode, latitude, longitude,
    } = await request.json();

    const VALID_BUSINESS_TYPES = ['CAFE', 'LAUNDRY', 'SALON'];

    // Coerce to a finite number or null — reject garbage rather than 500ing the whole save, and
    // never silently drop a real 0 (equator/prime-meridian) coordinate via `|| null`.
    const toFiniteOrNull = (value: unknown): number | null => {
      if (value === '' || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const updateData: any = {
      name,
      contactPerson,
      email,
      phone,
      address,
      landmark: landmark || null,
      city: city || null,
      state: state || null,
      country: country || null,
      postalCode: postalCode || null,
      latitude: toFiniteOrNull(latitude),
      longitude: toFiniteOrNull(longitude),
      gstin,
      website: website || null,
      currency: currency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
      businessType: VALID_BUSINESS_TYPES.includes(businessType) ? businessType : null,
    };

    const updatedTenant = await prisma.tenant.update({ where: { id: tenantId }, data: updateData });

    return NextResponse.json({ message: 'Settings updated successfully', tenant: updatedTenant });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
