import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions, clearSessionStateCache } from "@/lib/auth/nextauth";
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const PATCHABLE_TENANT_FIELDS = [
  'name', 'contactPerson', 'email', 'phone', 'address', 'gstin', 'subscriptionPlan', 'status',
  'logoUrl', 'website', 'websiteSlug', 'currency', 'timezone', 'aadharCardUrl',
] as const;
const VALID_TENANT_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, products: true, transactions: true } },
        users: {
          where: { role: 'ADMIN' },
          select: { profilePictureUrl: true, jobTitle: true, id: true },
          take: 1
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { users, ...tenantData } = tenant;
    return NextResponse.json({
      ...tenantData,
      adminUser: users[0] || null
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const nextStatus = body.status || existing.status;
    if (body.status && !VALID_TENANT_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const statusChanged = nextStatus !== existing.status;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(statusChanged ? { version: { increment: 1 } } : {}),
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        gstin: body.gstin || null,
        subscriptionPlan: body.subscriptionPlan,
        status: nextStatus,
        logoUrl: body.logoUrl || null,
        website: body.website || null,
        websiteSlug: body.websiteSlug || null,
        currency: body.currency || 'INR',
        timezone: body.timezone || 'Asia/Kolkata',
        aadharCardUrl: body.aadharCardUrl || null,
      }
    });

    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      await prisma.user.updateMany({
        where: { tenantId: id, role: 'ADMIN' },
        data: { password: hashedPassword, tokenVersion: { increment: 1 }, sessionsValidAfter: new Date() }
      });
    }
    if (statusChanged || body.password) clearSessionStateCache();

    if (body.profilePictureUrl || body.jobTitle) {
      await prisma.user.updateMany({
        where: { tenantId: id, role: 'ADMIN' },
        data: {
          ...(body.profilePictureUrl ? { profilePictureUrl: body.profilePictureUrl } : {}),
          ...(body.jobTitle ? { jobTitle: body.jobTitle } : {}),
        }
      });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // M9: never pass the raw body to Prisma (mass assignment — it could set domain,
    // version, ids, etc.). Only the same editable fields PUT accepts, and only those present.
    const data: Record<string, unknown> = {};
    for (const field of PATCHABLE_TENANT_FIELDS) {
      if (field in body) data[field] = body[field];
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    }
    if ('status' in data && !VALID_TENANT_STATUSES.includes(data.status as string)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await prisma.tenant.findUnique({ where: { id }, select: { status: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const statusChanged = 'status' in data && data.status !== existing.status;

    const tenant = await prisma.tenant.update({
      where: { id },
      // A status change bumps version (same as toggleTenantStatus) so open sessions re-check.
      data: statusChanged ? { ...data, version: { increment: 1 } } : data
    });
    if (statusChanged) clearSessionStateCache();

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error patching tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE', version: { increment: 1 } }
    });
    clearSessionStateCache();

    return NextResponse.json({ message: 'Tenant deactivated' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
