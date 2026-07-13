import React from 'react';
import { PromoBannerSection, WebsiteConfig } from '@/lib/website/types';

export default function PromoBanner({ data, config }: { data: PromoBannerSection['data'], config: WebsiteConfig }) {
  const bgImage = data.imageUrl || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';

  return (
    <section className="relative w-full h-[500px] flex items-center bg-gray-900">
      <div className="absolute inset-0">
        <img 
          src={bgImage} 
          alt="Promo Banner" 
          className="w-full h-full object-cover opacity-50"
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-center md:justify-end">
        <div className="bg-white p-12 md:p-16 max-w-lg text-center md:text-left">
          <span className="uppercase tracking-[0.2em] text-xs font-bold text-gray-500 mb-4 block">
            Special Offer
          </span>
          <h2 className="text-4xl font-serif text-gray-900 mb-6 leading-tight">
            {data.title || "Get 20% Off Your First Order"}
          </h2>
          <p className="text-gray-600 mb-8">
            {data.subtitle || "Sign up today and receive an exclusive discount on our new arrivals."}
          </p>
          <button className="px-8 py-4 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
            {data.buttonText || "Discover Now"}
          </button>
        </div>
      </div>
    </section>
  );
}
