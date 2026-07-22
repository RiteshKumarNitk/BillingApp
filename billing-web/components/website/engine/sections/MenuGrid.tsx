'use client';

import React, { useState } from 'react';
import { MenuGridSection, WebsiteConfig } from '@/lib/website/types';
import { Coffee, Star } from 'lucide-react';

export type MenuGridStyle = 'cards' | 'list' | 'luxury';

interface MenuGridProps {
  data: MenuGridSection['data'];
  config: WebsiteConfig;
  tenant: any;
  variant?: MenuGridStyle;
}

export default function MenuGrid({ data, tenant, variant = 'cards' }: MenuGridProps) {
  const allProducts = tenant?.products || [];
  const products = data.featuredOnly ? allProducts.filter((p: any) => p.isFeatured) : allProducts;
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'Menu')));
  const [activeTab, setActiveTab] = useState<string>(categories[0] || 'All');
  const currency = tenant?.currency || 'INR';
  const format = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  if (products.length === 0) return null;
  const filtered = activeTab === 'All' ? products : products.filter((p: any) => (p.category || 'Menu') === activeTab);

  if (variant === 'list') {
    return (
      <section className="py-24 px-6 bg-[var(--theme-background)]" id="menu">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>{data.title || 'The Menu'}</h2>
            {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-1.5 text-xs uppercase tracking-wide transition-colors ${activeTab === cat ? 'text-white bg-[var(--theme-primary)]' : 'text-gray-500 border border-black/10 hover:border-[var(--theme-primary)]'}`}>
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
                  {product.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>}
                </div>
                <div className="flex-1 border-b border-dotted border-black/15 mb-1.5 hidden sm:block" />
                <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--theme-primary)' }}>{format(product.salePrice)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'luxury') {
    const displayCategories = categories.slice(0, 6);
    return (
      <section className="py-24 bg-white" id="menu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-12">{data.title || 'Our Regular Menu Pack'}</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {displayCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all border ${activeTab === cat ? 'bg-[var(--theme-primary)] text-gray-900 border-[var(--theme-primary)] shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 text-left">
            {filtered.slice(0, 6).map((product: any) => (
              <div key={product.id} className="flex gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                  <img src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h4>
                  <div className="flex text-yellow-400 my-1 gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">{product.description || 'Freshly made, every time.'}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-extrabold text-gray-900">{format(product.salePrice)}</span>
                    <span className="px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-700">Add To Cart</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 'cards' — grid of image cards (modern-coffee's original look)
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-background)' }} id="menu">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>{data.title || 'Our Menu'}</h2>
          {data.subtitle && <p className="text-gray-500 mt-3 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveTab(cat)} className="px-6 py-2 rounded-full text-sm font-bold transition-all" style={activeTab === cat ? { backgroundColor: 'var(--theme-primary)', color: '#fff' } : { backgroundColor: 'transparent', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
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
                  <span className="font-black text-lg" style={{ color: 'var(--theme-primary)' }}>{format(product.salePrice)}</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-primary)' }}>Order</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
