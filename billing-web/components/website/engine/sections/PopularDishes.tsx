import React from 'react';
import { PopularDishesSection, WebsiteConfig } from '@/lib/website/types';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';

export default function PopularDishes({ data, tenant }: { data: PopularDishesSection['data']; config: WebsiteConfig; tenant: any }) {
  const products = tenant?.products || [];
  const displayProducts = products.slice(0, 4);
  if (displayProducts.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{data.title || 'Popular Dishes'}</h2>
            {data.subtitle && <p className="mt-4 text-gray-500 max-w-2xl">{data.subtitle}</p>}
          </div>
          <div className="hidden md:flex gap-4">
            <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-colors bg-gray-50 hover:bg-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900 hover:opacity-90 transition-opacity">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayProducts.map((product: any) => (
            <div key={product.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow flex flex-col items-center text-center group cursor-pointer relative overflow-hidden">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-6 shadow-md transform group-hover:scale-105 transition-transform duration-500 bg-gray-50 p-2">
                <img src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt={product.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate w-full">{product.name}</h3>
              <div className="flex text-yellow-400 mb-4 gap-1">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{product.description || 'Freshly made, every time.'}</p>
              <div className="flex items-center justify-between w-full mt-auto">
                <div className="text-2xl font-extrabold text-gray-900">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: tenant?.currency || 'INR', maximumFractionDigits: 0 }).format(product.salePrice)}
                </div>
                <button className="px-5 py-2 rounded-full bg-[var(--theme-primary)] text-gray-900 font-bold text-sm hover:scale-105 transition-transform shadow-sm">Add To Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
