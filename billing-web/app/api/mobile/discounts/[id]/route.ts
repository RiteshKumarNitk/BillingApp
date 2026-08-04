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
    const user = await getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      const permissions = await getRequesterPermissions(user.tenantRole as string | null);
      if (!permissions.includes('EDIT_PRODUCT')) {
        return corsResponse({ error: 'Forbidden: Requires EDIT_PRODUCT permission' }, { status: 403 });
      }
    }

    const existing = await prisma.discount.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Discount not found' }, { status: 404 });
    }

    const data = await request.json();
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description,
        discountPercentage: data.discountPercentage !== undefined ? parseFloat(data.discountPercentage) : undefined,
        applicableCategory: data.applicableCategory,
        minimumQuantity: data.minimumQuantity !== undefined ? parseInt(data.minimumQuantity) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
      },
    });

    return corsResponse({ discount });
  } catch (error: any) {
    console.error('Mobile discounts PUT error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      const permissions = await getRequesterPermissions(user.tenantRole as string | null);
      if (!permissions.includes('EDIT_PRODUCT')) {
        return corsResponse({ error: 'Forbidden: Requires EDIT_PRODUCT permission' }, { status: 403 });
      }
    }

    const existing = await prisma.discount.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Discount not found' }, { status: 404 });
    }

    await prisma.discount.delete({ where: { id } });
    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile discounts DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
