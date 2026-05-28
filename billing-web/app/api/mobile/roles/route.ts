import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      where: { tenantId: user.tenantId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });

    return corsResponse({ roles });
  } catch (error: any) {
    console.error('Mobile roles GET error:', error);
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
    if (!data.name) {
      return corsResponse({ error: 'Role name is required' }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({
      where: { tenantId_name: { tenantId: authUser.tenantId, name: data.name.trim() } },
    });
    if (existing) {
      return corsResponse({ error: 'Role name already exists' }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: {
        name: data.name.trim(),
        permissions: data.permissions || [],
        tenant: { connect: { id: authUser.tenantId } },
      },
    });

    return corsResponse({ role }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile roles POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
