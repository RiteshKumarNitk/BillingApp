'use client';
import React, { useState } from 'react';
import { FeaturedProductsSection, WebsiteConfig } from '@/lib/website/types';
import { ShoppingCart, Star } from 'lucide-react';

export default function FeaturedProducts({ data, config, tenant }: { data: FeaturedProductsSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'All')));
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p: any) => (p.category || 'All') === activeCategory);

  const displayProducts = filtered.slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Our Produce</span>
          <h2 className="text-4xl font-extrabold text-green-900 tracking-tight mt-2 mb-4">
            {data.title || "Featured Fresh Produce"}
          </h2>
          {data.subtitle && <p className="text-green-700/60 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeCategory === 'All' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'}`}
          >
            All
          </button>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeCategory === cat ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product: any) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-green-100">
              <div className="relative aspect-square overflow-hidden bg-green-50">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Fresh
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-green-900 mb-1 truncate">{product.name}</h3>
                {product.description && <p className="text-sm text-green-700/60 mb-3 line-clamp-1">{product.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-green-700">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR', maximumFractionDigits: 0 }).format(product.salePrice)}
                    <span className="text-sm font-normal text-green-500 ml-1">/{product.unit?.toLowerCase() || 'kg'}</span>
                  </span>
                  <button className="p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md hover:shadow-lg transform hover:scale-105">
                    <ShoppingCart className="w-4 h-4" />
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
