import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantRoleId: true,
        tenantRole: { select: { name: true, permissions: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return corsResponse({ users });
  } catch (error: any) {
    console.error('Mobile users GET error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = getMobileUserFromAuthHeader(request);
    if (!authUser || !authUser.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name || !data.email || !data.password) {
      return corsResponse({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return corsResponse({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        phone: data.phone || null,
        role: 'ADMIN',
        tenantRoleId: data.tenantRoleId || null,
        tenant: { connect: { id: authUser.tenantId } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantRoleId: true,
        createdAt: true,
      },
    });

    return corsResponse({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile users POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
