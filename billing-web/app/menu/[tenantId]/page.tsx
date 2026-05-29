import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import MenuClient from './MenuClient';

export default async function PublicMenuPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, phone: true, menuTheme: true }
  });

  if (!tenant) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { tenantId },
    include: { variants: true },
    orderBy: { name: 'asc' }
  });

  // Group products by category
  const categoriesMap = new Map<string, any[]>();
  products.forEach(p => {
    const cat = p.category || 'Other';
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat)!.push(p);
  });

  const categorizedProducts = Array.from(categoriesMap.entries()).map(([category, items]) => ({
    category,
    items
  })).sort((a, b) => a.category.localeCompare(b.category));

  return (
    <MenuClient 
      tenant={tenant}
      categorizedProducts={categorizedProducts} 
      theme={tenant.menuTheme || "DEFAULT"} 
    />
  );
}
