import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        gstin: body.gstin || null,
        subscriptionPlan: body.subscriptionPlan,
        status: body.status || existing.status,
        logoUrl: body.logoUrl || null,
        website: body.website || null,
        currency: body.currency || 'INR',
        timezone: body.timezone || 'Asia/Kolkata',
        aadharCardUrl: body.aadharCardUrl || null,
      }
    });

    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      await prisma.user.updateMany({
        where: { tenantId: id, role: 'ADMIN' },
        data: { password: hashedPassword }
      });
    }

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

    const tenant = await prisma.tenant.update({
      where: { id },
      data: body
    });

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
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ message: 'Tenant deactivated' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
