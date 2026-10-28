import prisma from '@/lib/prisma';
import { resolveTenant, getWebsiteConfig } from '@/lib/website/utils';
import WebsiteRenderer from '@/components/website/WebsiteRenderer';
import PageDisabled from '@/components/website/PageDisabled';
import ShopClient from './ShopClient';
import { notFound } from 'next/navigation';
import { toPublicSiteTenant, PUBLIC_PRODUCT_SELECT, PUBLIC_PRODUCT_WHERE } from '@/lib/website/publicTenant';

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
      <WebsiteRenderer config={config} tenant={toPublicSiteTenant(tenant)}>
        <PageDisabled label="Shop" />
      </WebsiteRenderer>
    );
  }

  // Public projection only — these rows are serialized into the page for every visitor, so no
  // purchase price / barcode / batch data (see lib/website/publicTenant.ts).
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, ...PUBLIC_PRODUCT_WHERE },
    select: PUBLIC_PRODUCT_SELECT,
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
    <WebsiteRenderer config={config} tenant={toPublicSiteTenant(tenant)}>
      <ShopClient categorizedProducts={categorizedProducts} layoutStyle={tenant.menuTheme} config={config} />
    </WebsiteRenderer>
  );
}
