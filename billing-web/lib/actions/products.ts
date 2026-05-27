"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

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

export async function getFilteredProducts(searchTerm: string, categoryFilter: string) {
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

  const results = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  return results;
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

  return distinctCategories.map(c => c.category).filter(Boolean) as string[];
}
