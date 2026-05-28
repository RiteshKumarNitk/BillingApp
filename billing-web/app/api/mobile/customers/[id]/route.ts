import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Customer not found' }, { status: 404 });
    }

    const data = await request.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        phone: data.phone,
        email: data.email,
        address: data.address,
        loyaltyPoints: data.loyaltyPoints !== undefined ? parseInt(data.loyaltyPoints) : undefined,
        totalSpent: data.totalSpent !== undefined ? parseFloat(data.totalSpent) : undefined,
        lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : undefined,
      },
    });

    return corsResponse({ customer });
  } catch (error: any) {
    console.error('Mobile customers PUT error:', error);
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

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({ where: { id } });
    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile customers DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
