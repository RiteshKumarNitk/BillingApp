import prisma from '@/lib/prisma';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import WebsiteRenderer from '@/components/website/WebsiteRenderer';
import PageDisabled from '@/components/website/PageDisabled';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ShopPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);

  if (!tenant) {
    notFound();
  }

  const config = getWebsiteConfig(tenant);

  if (config.pages?.shop === false) {
    return (
      <WebsiteRenderer config={config} tenant={tenant}>
        <PageDisabled label="Shop" />
      </WebsiteRenderer>
    );
  }

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

  return (
    <WebsiteRenderer config={config} tenant={tenant}>
      <ShopClient categorizedProducts={categorizedProducts} theme={tenant.menuTheme} />
    </WebsiteRenderer>
  );
}
