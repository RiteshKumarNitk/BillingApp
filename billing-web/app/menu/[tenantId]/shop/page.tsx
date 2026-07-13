import prisma from '@/lib/prisma';
import { getMenuTenant } from '../data';
import ShopClient from './ShopClient';

export default async function ShopPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await getMenuTenant(tenantId);

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id },
    include: { variants: true },
    orderBy: { name: 'asc' }
  });

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

  return <ShopClient categorizedProducts={categorizedProducts} theme={tenant.menuTheme} />;
}
