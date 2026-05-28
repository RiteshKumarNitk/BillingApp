import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    let shop = await prisma.shop.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!shop) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      shop = await prisma.shop.create({
        data: {
          name: tenant?.name || '',
          tenant: { connect: { id: user.tenantId } },
        },
      });
    }

    return corsResponse({ shop });
  } catch (error: any) {
    console.error('Mobile shop GET error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const shop = await prisma.shop.upsert({
      where: { tenantId: user.tenantId },
      update: {
        name: data.name,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        phoneNumber: data.phoneNumber,
        upiId: data.upiId,
        footerText: data.footerText,
        defaultTaxRate: data.defaultTaxRate !== undefined ? parseFloat(data.defaultTaxRate) : undefined,
      },
      create: {
        name: data.name || '',
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        phoneNumber: data.phoneNumber,
        upiId: data.upiId,
        footerText: data.footerText,
        defaultTaxRate: parseFloat(data.defaultTaxRate) || 0,
        tenant: { connect: { id: user.tenantId } },
      },
    });

    return corsResponse({ shop });
  } catch (error: any) {
    console.error('Mobile shop PUT error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
