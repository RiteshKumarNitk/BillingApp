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

    const { name, contactPerson, email, phone, address, gstin, website, currency, timezone, businessType } = await request.json();

    const VALID_BUSINESS_TYPES = ['CAFE', 'LAUNDRY', 'SALON'];

    const updateData: any = {
      name,
      contactPerson,
      email,
      phone,
      address,
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
