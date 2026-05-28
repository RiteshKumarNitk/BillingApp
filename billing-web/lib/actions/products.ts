"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function searchProducts(searchTerm: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  if (!searchTerm.trim()) {
    return [];
  }

  const results = await prisma.product.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { barcode: { contains: searchTerm } }
      ]
    },
    take: 10
  });

  return results;
}

export async function getFilteredProducts(searchTerm: string, categoryFilter: string, lowStockOnly?: boolean, page?: number, limit?: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;
  const where: any = { tenantId };
  
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { barcode: { contains: searchTerm } }
    ];
  }
  if (categoryFilter) {
    where.category = categoryFilter;
  }
  if (lowStockOnly) {
    where.stock = { lte: 10 };
  }

  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = limit;

  const [results, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: results, total };
}

export async function getProductCategories() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    return [];
  }

  const distinctCategories = await prisma.product.findMany({
    where: { tenantId: session.user.tenantId, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });

  return distinctCategories.map((c: { category?: string | null }) => c.category).filter(Boolean) as string[];
}

export async function createProduct(data: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  if (!data.name) {
    throw new Error("Product name is required");
  }

  // Auto-generate barcode if not provided
  const barcode = data.barcode?.trim() || null;

  const createData: any = {
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
    tenant: { connect: { id: tenantId } },
  };

  const product = await prisma.product.create({ data: createData });

  revalidatePath('/products');
  return product;
}

export async function updateProduct(productId: string, data: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  const barcode = data.barcode?.trim() || null;

  const updateData: any = {
    name: data.name?.trim(),
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
  };

  const product = await prisma.product.update({ where: { id: productId, tenantId: tenantId }, data: updateData });

  revalidatePath('/products');
  return product;
}

export async function deleteProduct(productId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  await prisma.product.delete({
    where: { id: productId, tenantId }
  });

  revalidatePath('/products');
}
