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

    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Product not found' }, { status: 404 });
    }

    const data = await request.json();

    if (data.barcode) {
      const barcodeExists = await prisma.product.findFirst({
        where: { barcode: data.barcode, id: { not: id }, tenantId: user.tenantId },
      });
      if (barcodeExists) {
        return corsResponse({ error: 'Barcode already exists' }, { status: 409 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        barcode: data.barcode?.trim(),
        unit: data.unit,
        purchasePrice: data.purchasePrice !== undefined ? parseFloat(data.purchasePrice) : undefined,
        mrp: data.mrp !== undefined ? parseFloat(data.mrp) : undefined,
        salePrice: data.salePrice !== undefined ? parseFloat(data.salePrice) : undefined,
        stock: data.stock !== undefined ? parseInt(data.stock) : undefined,
        minStockThreshold: data.minStockThreshold !== undefined ? parseInt(data.minStockThreshold) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : data.expiryDate === null ? null : undefined,
        manufacturingDate: data.manufacturingDate ? new Date(data.manufacturingDate) : data.manufacturingDate === null ? null : undefined,
        batchNumber: data.batchNumber?.trim(),
        category: data.category,
      },
    });

    return corsResponse({ product });
  } catch (error: any) {
    console.error('Mobile products PUT error:', error);
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

    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return corsResponse({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Mobile products DELETE error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
