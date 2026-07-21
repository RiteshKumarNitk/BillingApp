"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import { checkFeatureLimit } from "@/lib/subscription";

export async function searchProducts(searchTerm: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  if (!searchTerm.trim()) {
    const results = await prisma.product.findMany({
      where: { tenantId },
      include: {
        variants: true,
        batches: true,
        serials: true
      },
      take: 50
    });
    return results;
  }

  const results = await prisma.product.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { barcode: { contains: searchTerm } }
      ]
    },
    include: {
      variants: true,
      batches: true,
      serials: true
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
    // Basic low stock check. For complex types, this might need refinement in the future.
    where.stock = { lte: 10 };
  }

  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = limit;

  const [results, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: true,
        batches: true,
        serials: true
      },
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

// Cafe POS: full menu grid, unlike searchProducts()'s 50-item cap (meant for a search-as-you-type
// list, not a full category/card grid where every item needs to be visible up front).
export async function getCafeMenu() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return [];
  }

  return prisma.product.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      variants: true,
      addOns: true,
      comboComponents: { include: { component: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  });
}

// Cafe: candidate list for the Combo Components picker. Excludes COMBO products themselves to
// keep combos one level deep (no combo-of-combos).
export async function getProductsForComboPicker(excludeProductId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      tenantId: session.user.tenantId,
      productType: { not: 'COMBO' },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { id: true, name: true, salePrice: true },
    orderBy: { name: 'asc' },
  });
}

export async function createProduct(data: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.tenantId;

  const limitCheck = await checkFeatureLimit(tenantId, "products");
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason);
  }

  if (!data.name) {
    throw new Error("Product name is required");
  }

  const barcode = data.barcode?.trim() || null;
  const productType = data.productType || 'SIMPLE';

  const createData: any = {
    name: data.name.trim(),
    category: data.category || null,
    productType,
    unit: data.unit || 'PIECE',
    allowDecimal: data.allowDecimal === true,
    barcode: barcode,
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    mrp: parseFloat(data.mrp) || 0,
    salePrice: parseFloat(data.salePrice) || 0,
    stock: parseFloat(data.stock) || 0,
    minStockThreshold: parseFloat(data.minStockThreshold) || 10,
    imageUrl: data.imageUrl || null,
    description: data.description?.trim() || null,
    durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes, 10) : null,
    garmentType: data.garmentType || null,
    gstRate: data.gstRate !== undefined && data.gstRate !== '' ? parseFloat(data.gstRate) : null,
    gstInclusive: data.gstInclusive === true,
    foodType: data.foodType || null,
    isAvailable: data.isAvailable !== false,
    isFeatured: data.isFeatured === true,
    tenant: { connect: { id: tenantId } },
  };

  // Conditionally add nested relations
  if ((productType === 'VARIANT' || productType === 'WEIGHT') && data.variants && data.variants.length > 0) {
    createData.variants = {
      create: data.variants.map((v: any) => ({
        name: v.name,
        barcode: v.barcode || null,
        purchasePrice: parseFloat(v.purchasePrice) || 0,
        mrp: parseFloat(v.mrp) || 0,
        salePrice: parseFloat(v.salePrice) || 0,
        stock: parseFloat(v.stock) || 0,
      }))
    };
  } else if (productType === 'BATCH' && data.batches && data.batches.length > 0) {
    createData.batches = {
      create: data.batches.map((b: any) => ({
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate) : null,
        expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
        stock: parseFloat(b.stock) || 0,
      }))
    };
    // Sum up the stock for the master record
    createData.stock = data.batches.reduce((sum: number, b: any) => sum + (parseFloat(b.stock) || 0), 0);
  } else if (productType === 'SERIAL' && data.serials && data.serials.length > 0) {
    createData.serials = {
      create: data.serials.map((s: any) => ({
        serialNumber: s.serialNumber,
        status: 'AVAILABLE',
      }))
    };
    createData.stock = data.serials.length;
  }

  // Cafe: add-ons belong to any product type except COMBO; combo components only apply to COMBO.
  if (data.addOns && data.addOns.length > 0 && productType !== 'COMBO') {
    createData.addOns = {
      create: data.addOns.filter((a: any) => a.name?.trim()).map((a: any) => ({
        name: a.name.trim(),
        price: parseFloat(a.price) || 0,
      }))
    };
  }
  if (productType === 'COMBO' && data.comboComponents && data.comboComponents.length > 0) {
    createData.comboComponents = {
      create: data.comboComponents.filter((c: any) => c.componentId).map((c: any) => ({
        componentId: c.componentId,
        quantity: parseInt(c.quantity, 10) || 1,
      }))
    };
  }

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
  const productType = data.productType || 'SIMPLE';

  const updateData: any = {
    name: data.name?.trim(),
    category: data.category || null,
    productType,
    unit: data.unit || 'PIECE',
    allowDecimal: data.allowDecimal === true,
    barcode: barcode,
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    mrp: parseFloat(data.mrp) || 0,
    salePrice: parseFloat(data.salePrice) || 0,
    stock: parseFloat(data.stock) || 0,
    minStockThreshold: parseFloat(data.minStockThreshold) || 10,
    imageUrl: data.imageUrl || null,
    description: data.description?.trim() || null,
    durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes, 10) : null,
    garmentType: data.garmentType || null,
    gstRate: data.gstRate !== undefined && data.gstRate !== '' ? parseFloat(data.gstRate) : null,
    gstInclusive: data.gstInclusive === true,
    foodType: data.foodType || null,
    isAvailable: data.isAvailable !== false,
    isFeatured: data.isFeatured === true,
  };

  // Handling updates for complex types is more intricate (needs delete/re-create or upsert)
  // For this v1, we will replace the nested records for simplicity.
  
  if ((productType === 'VARIANT' || productType === 'WEIGHT') && data.variants) {
    updateData.variants = {
      deleteMany: {},
      create: data.variants.map((v: any) => ({
        name: v.name,
        barcode: v.barcode || null,
        purchasePrice: parseFloat(v.purchasePrice) || 0,
        mrp: parseFloat(v.mrp) || 0,
        salePrice: parseFloat(v.salePrice) || 0,
        stock: parseFloat(v.stock) || 0,
      }))
    };
  } else if (productType === 'BATCH' && data.batches) {
    updateData.batches = {
      deleteMany: {},
      create: data.batches.map((b: any) => ({
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate) : null,
        expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
        stock: parseFloat(b.stock) || 0,
      }))
    };
    updateData.stock = data.batches.reduce((sum: number, b: any) => sum + (parseFloat(b.stock) || 0), 0);
  } else if (productType === 'SERIAL' && data.serials) {
    updateData.serials = {
      deleteMany: {},
      create: data.serials.map((s: any) => ({
        serialNumber: s.serialNumber,
        status: s.status || 'AVAILABLE',
      }))
    };
    updateData.stock = data.serials.filter((s:any) => s.status !== 'SOLD').length;
  }

  // Cafe: replace add-ons / combo components wholesale on every save, same simplicity tradeoff
  // as variants/batches/serials above.
  if (data.addOns !== undefined && productType !== 'COMBO') {
    updateData.addOns = {
      deleteMany: {},
      create: data.addOns.filter((a: any) => a.name?.trim()).map((a: any) => ({
        name: a.name.trim(),
        price: parseFloat(a.price) || 0,
      }))
    };
  }
  if (productType === 'COMBO' && data.comboComponents !== undefined) {
    updateData.comboComponents = {
      deleteMany: {},
      create: data.comboComponents.filter((c: any) => c.componentId).map((c: any) => ({
        componentId: c.componentId,
        quantity: parseInt(c.quantity, 10) || 1,
      }))
    };
  }

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
