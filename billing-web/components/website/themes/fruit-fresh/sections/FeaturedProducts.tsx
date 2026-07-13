'use client';
import React, { useState } from 'react';
import { FeaturedProductsSection, WebsiteConfig } from '@/lib/website/types';
import { ShoppingBag, Star } from 'lucide-react';

export default function FeaturedProducts({ data, config, tenant }: { data: FeaturedProductsSection['data'], config: WebsiteConfig, tenant: any }) {
  const products = tenant?.products || [];
  const categories: string[] = Array.from(new Set(products.map((p: any) => p.category || 'All')));
  const [activeCat, setActiveCat] = useState('All');

  const filtered = activeCat === 'All' ? products : products.filter((p: any) => (p.category || 'All') === activeCat);
  const display = filtered.slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Our Selection</span>
          <h2 className="text-4xl font-bold text-orange-900 tracking-tight mt-2 mb-4">
            {data.title || "Fresh Picks For You"}
          </h2>
          {data.subtitle && <p className="text-orange-700/50 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button onClick={() => setActiveCat('All')} className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeCat === 'All' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'}`}>All</button>
          {categories.slice(0, 5).map(c => (
            <button key={c} onClick={() => setActiveCat(c)} className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${activeCat === c ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'}`}>{c}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {display.map((product: any) => (
            <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-orange-100/50">
              <div className="relative aspect-square overflow-hidden bg-orange-50 p-4">
                <img src={product.imageUrl || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} alt={product.name} className="w-full h-full object-cover rounded-2xl transform group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-6 right-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Fresh</div>
              </div>
              <div className="p-5 pt-3">
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <h3 className="text-lg font-bold text-orange-900 mb-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-2xl font-extrabold text-orange-700">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR', maximumFractionDigits: 0 }).format(product.salePrice)}
                    </span>
                    <span className="text-sm text-orange-400 ml-1">/kg</span>
                  </div>
                  <button className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all">
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
