import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerIdFromAuthHeader } from '@/lib/auth/customer-mobile';
import { cafePublicSelect, toPublicCafe } from '@/lib/cafes/cafePublicFields';

// GET: list this customer's favourited cafes, same per-cafe shape as GET /cafes.
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.customerFavorite.findMany({
      where: { customerAccountId },
      orderBy: { createdAt: 'desc' },
      select: { tenant: { select: cafePublicSelect } },
    });

    return NextResponse.json({ cafes: favorites.map((f) => ({ ...toPublicCafe(f.tenant), distanceKm: null })) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: favourite a cafe. Body: { tenantId }
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    await prisma.customerFavorite.upsert({
      where: { customerAccountId_tenantId: { customerAccountId, tenantId } },
      create: { customerAccountId, tenantId },
      update: {},
    });

    return NextResponse.json({ message: 'Added to favourites' }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: unfavourite a cafe. Query param: ?tenantId=
export async function DELETE(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = new URL(request.url).searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    await prisma.customerFavorite.deleteMany({ where: { customerAccountId, tenantId } });

    return NextResponse.json({ message: 'Removed from favourites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
