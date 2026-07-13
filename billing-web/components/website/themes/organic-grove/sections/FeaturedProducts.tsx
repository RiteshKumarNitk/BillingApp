'use client';
import React from 'react';
import { FeaturedProductsSection, WebsiteConfig } from '@/lib/website/types';
import { ShoppingBag, Star } from 'lucide-react';

export default function FeaturedProducts({ data, config, tenant }: { data: FeaturedProductsSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  const displayProducts = products.slice(0, 6);

  if (products.length === 0) return null;

  return (
    <section id="products" className="py-24 bg-[var(--theme-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--theme-primary)] font-semibold text-sm uppercase tracking-widest">Organic Selection</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight mt-3 mb-4">
            {data.title || "Our Organic Collection"}
          </h2>
          {data.subtitle && <p className="text-stone-500 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product: any) => (
            <div key={product.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-amber-100/50">
              <div className="aspect-[4/3] overflow-hidden bg-stone-50">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--theme-primary)] bg-[var(--theme-primary)]/10 px-3 py-1 rounded-full">Organic</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-1">{product.name}</h3>
                <p className="text-sm text-stone-400 mb-4 line-clamp-1">{product.description || "Certified organic produce"}</p>
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <span className="text-2xl font-bold text-stone-900">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR', maximumFractionDigits: 0 }).format(product.salePrice)}
                  </span>
                  <button className="p-3 bg-[var(--theme-primary)] text-white rounded-full hover:shadow-lg hover:scale-105 transition-all">
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
