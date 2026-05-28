import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.discount.count({ where: { tenantId: user.tenantId } }),
    ]);

    return corsResponse({
      discounts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Mobile discounts GET error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name || data.discountPercentage === undefined) {
      return corsResponse({ error: 'Name and discount percentage are required' }, { status: 400 });
    }

    const discount = await prisma.discount.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        discountPercentage: parseFloat(data.discountPercentage),
        applicableCategory: data.applicableCategory || null,
        minimumQuantity: parseInt(data.minimumQuantity) || 1,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        tenant: { connect: { id: user.tenantId } },
      },
    });

    return corsResponse({ discount }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile discounts POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
