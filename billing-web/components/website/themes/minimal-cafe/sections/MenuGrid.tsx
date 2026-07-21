"use client";

import React, { useState } from 'react';
import { MenuGridSection, WebsiteConfig } from '@/lib/website/types';

export default function MenuGrid({ data, config, tenant }: { data: MenuGridSection['data'], config: WebsiteConfig, tenant: any }) {
  const allProducts = tenant?.products || [];
  const products = data.featuredOnly ? allProducts.filter((p: any) => p.isFeatured) : allProducts;
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'Menu')));
  const [activeTab, setActiveTab] = useState<string>(categories[0] || 'All');

  if (products.length === 0) return null;

  const filtered = activeTab === 'All' ? products : products.filter((p: any) => (p.category || 'Menu') === activeTab);
  const currency = tenant?.currency || 'INR';

  return (
    <section className="py-24 px-6 bg-[var(--theme-background)]" id="menu">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'The Menu'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 text-xs uppercase tracking-wide transition-colors ${
                  activeTab === cat ? 'text-white bg-[var(--theme-primary)]' : 'text-gray-500 border border-black/10 hover:border-[var(--theme-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="divide-y divide-black/10">
          {filtered.slice(0, 10).map((product: any) => (
            <div key={product.id} className="flex items-baseline justify-between gap-4 py-4">
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                {product.description && (
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
                )}
              </div>
              <div className="flex-1 border-b border-dotted border-black/15 mb-1.5 hidden sm:block" />
              <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--theme-primary)' }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(product.salePrice)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
