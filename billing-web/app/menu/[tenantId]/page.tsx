import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import MenuClient from './MenuClient';

export default async function PublicMenuPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, address: true, phone: true }
  });

  if (!tenant) {
    notFound();
  }

  // Fetch products that are in stock or maybe all products?
  // Let's fetch all products and show "Out of stock" if stock <= 0
  const products = await prisma.product.findMany({
    where: { tenantId },
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-extrabold text-gray-900 text-center">{tenant.name}</h1>
          {tenant.address && (
            <p className="text-sm text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4 text-indigo-500" />
              {tenant.address}
            </p>
          )}
        </div>
      </header>

      {/* Menu Content (Client Component for search/filtering) */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <MenuClient categorizedProducts={categorizedProducts} />
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by BillingApp
      </footer>
    </div>
  );
}
