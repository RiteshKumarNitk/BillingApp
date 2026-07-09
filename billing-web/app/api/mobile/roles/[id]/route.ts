import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

async function getRequesterPermissions(tenantRoleId: string | null | undefined): Promise<string[]> {
  if (!tenantRoleId) return [];
  const role = await prisma.role.findUnique({ where: { id: tenantRoleId } });
  return role?.permissions || [];
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      const permissions = await getRequesterPermissions(user.tenantRole as string | null);
      if (!permissions.includes('MANAGE_USERS')) {
        return corsResponse({ error: 'Forbidden: Requires MANAGE_USERS permission' }, { status: 403 });
      }
    }

    const existing = await prisma.role.findFirst({
      where: { id, tenantId: user.tenantId as string },
    });
    if (!existing) {
      return corsResponse({ error: 'Role not found' }, { status: 404 });
    }
    if (existing.name === 'Owner') {
      return corsResponse({ error: 'Cannot edit the default Owner role' }, { status: 400 });
    }

    const data = await request.json();
    if (!data.name || !data.name.trim()) {
      return corsResponse({ error: 'Role name is required' }, { status: 400 });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: data.name.trim(),
        permissions: data.permissions || [],
      },
    });

    await prisma.user.updateMany({
      where: { tenantRoleId: id },
      data: { tokenVersion: { increment: 1 } },
    });

    return corsResponse({ role });
  } catch (error: any) {
    console.error('Mobile roles PUT error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      const permissions = await getRequesterPermissions(user.tenantRole as string | null);
      if (!permissions.includes('MANAGE_USERS')) {
        return corsResponse({ error: 'Forbidden: Requires MANAGE_USERS permission' }, { status: 403 });
      }
    }

    const existing = await prisma.role.findFirst({
      where: { id, tenantId: user.tenantId as string },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      return corsResponse({ error: 'Role not found' }, { status: 404 });
    }
    if (existing.name === 'Owner') {
      return corsResponse({ error: 'Cannot delete the Owner role' }, { status: 400 });
    }
    if (existing._count.users > 0) {
      return corsResponse({ error: 'Cannot delete a role that is assigned to users' }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });

    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile roles DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
