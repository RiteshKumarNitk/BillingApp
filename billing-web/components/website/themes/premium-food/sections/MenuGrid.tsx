"use client";

import React, { useState } from 'react';
import { MenuGridSection, WebsiteConfig } from '@/lib/website/types';
import { Star } from 'lucide-react';

export default function MenuGrid({ data, config, tenant }: { data: MenuGridSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  
  // Extract categories
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'Special Foods')));
  const displayCategories = categories.slice(0, 6);

  const [activeTab, setActiveTab] = useState(displayCategories[0] || 'All');

  const filteredProducts = activeTab === 'All' 
    ? products 
    : products.filter((p: any) => (p.category || 'Special Foods') === activeTab);

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-white" id="menu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-12">
          {data.title || "Our Regular Menu Pack"}
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {displayCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all border ${
                activeTab === cat 
                  ? 'bg-[var(--theme-primary)] text-gray-900 border-[var(--theme-primary)] shadow-md transform scale-105' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 text-left">
          {filteredProducts.slice(0, 6).map((product: any) => (
            <div key={product.id} className="flex gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                <img 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} 
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col flex-1 py-1">
                <h4 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h4>
                <div className="flex text-yellow-400 my-1 gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">
                  {product.description || "Pasta is a type of food typically made from an unleavened dough."}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-extrabold text-gray-900">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR', maximumFractionDigits: 0 }).format(product.salePrice)}
                  </span>
                  <button className="px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-[var(--theme-primary)] hover:text-gray-900 hover:border-[var(--theme-primary)] transition-colors">
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length > 6 && (
           <button className="mt-12 px-8 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
             View Full Menu
           </button>
        )}
      </div>
    </section>
  );
}
