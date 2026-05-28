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
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let where: any = { tenantId: user.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } }
      ];
    }
    if (category) {
      where.category = category;
    }
    if (lowStock === 'true') {
      where.stock = { lte: 10 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return corsResponse({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Mobile products GET error:', error);
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

    if (!data.name) {
      return corsResponse({ error: 'Product name is required' }, { status: 400 });
    }

    const barcode = data.barcode?.trim() || null;

    if (barcode) {
      const existing = await prisma.product.findUnique({ where: { barcode } });
      if (existing) {
        return corsResponse({ error: 'Barcode already exists' }, { status: 409 });
      }
    }

    const createData: any = {
      name: data.name.trim(),
      barcode,
      unit: data.unit || 'PIECE',
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      mrp: parseFloat(data.mrp) || 0,
      salePrice: parseFloat(data.salePrice) || 0,
      stock: parseInt(data.stock, 10) || 0,
      minStockThreshold: parseInt(data.minStockThreshold, 10) || 10,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : null,
      batchNumber: data.batchNumber?.trim() || null,
      category: data.category || null,
      tenant: { connect: { id: user.tenantId } },
    };

    const product = await prisma.product.create({ data: createData });

    return corsResponse({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile products POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
