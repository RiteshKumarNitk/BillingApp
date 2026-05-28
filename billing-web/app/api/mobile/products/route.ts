import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let where: any = { tenantId: user.tenantId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Mobile products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const barcode = data.barcode?.trim() || null;

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        barcode: barcode,
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
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
