import React from 'react';
import { FeaturedProductsSection, WebsiteConfig } from '@/lib/website/types';

export default function FeaturedProducts({ data, config, tenant }: { data: FeaturedProductsSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  const displayProducts = products.slice(0, 4);

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-serif text-gray-900 mb-2">{data.title || "Featured Products"}</h2>
            {data.subtitle && <p className="text-gray-500 uppercase tracking-widest text-sm">{data.subtitle}</p>}
          </div>
          <a href="#" className="hidden sm:inline-block border-b border-gray-900 text-gray-900 uppercase tracking-widest text-xs font-bold pb-1 hover:text-gray-600 transition-colors">
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {displayProducts.map((product: any) => (
            <div key={product.id} className="group relative">
              <div className="aspect-[3/4] w-full overflow-hidden bg-gray-200 mb-4 relative">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute bottom-4 left-4 right-4 bg-white text-gray-900 py-3 text-sm font-bold uppercase tracking-widest opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-900 hover:text-white">
                  Add to Cart
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="text-sm font-medium text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR' }).format(product.salePrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
