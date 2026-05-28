import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Employee not found' }, { status: 404 });
    }

    const data = await request.json();
    const updateData: any = {
      name: data.name?.trim(),
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
      monthlySalesTarget: data.monthlySalesTarget !== undefined ? parseFloat(data.monthlySalesTarget) : undefined,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return corsResponse({ employee });
  } catch (error: any) {
    console.error('Mobile employees PUT error:', error);
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

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Employee not found' }, { status: 404 });
    }

    await prisma.employee.delete({ where: { id } });
    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile employees DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
