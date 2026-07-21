"use client";

import React, { useState } from 'react';
import { MenuGridSection, WebsiteConfig } from '@/lib/website/types';
import { Coffee } from 'lucide-react';

export default function MenuGrid({ data, config, tenant }: { data: MenuGridSection['data'], config: WebsiteConfig, tenant: any }) {
  const allProducts = tenant?.products || [];
  const products = data.featuredOnly ? allProducts.filter((p: any) => p.isFeatured) : allProducts;
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'Menu')));
  const [activeTab, setActiveTab] = useState<string>(categories[0] || 'All');

  if (products.length === 0) return null;

  const filtered = activeTab === 'All' ? products : products.filter((p: any) => (p.category || 'Menu') === activeTab);
  const currency = tenant?.currency || 'INR';

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-background)' }} id="menu">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'Our Menu'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className="px-6 py-2 rounded-full text-sm font-bold transition-all"
                style={activeTab === cat
                  ? { backgroundColor: 'var(--theme-primary)', color: '#fff' }
                  : { backgroundColor: 'transparent', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(0, 9).map((product: any) => (
            <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-background)' }}>
                    <Coffee className="w-10 h-10 opacity-20" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900">{product.name}</h4>
                {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-black text-lg" style={{ color: 'var(--theme-primary)' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(product.salePrice)}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-primary)' }}>
                    Order
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
