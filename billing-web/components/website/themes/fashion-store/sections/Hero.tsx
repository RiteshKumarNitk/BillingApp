import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';

export default function Hero({ data, config }: { data: HeroSection['data'], config: WebsiteConfig }) {
  const bgImage = data.backgroundImageUrl || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';

  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center bg-gray-100 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Hero Fashion" 
          className="w-full h-full object-cover object-center"
        />
        {/* Very subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <span className="text-white uppercase tracking-[0.3em] font-medium text-sm mb-4 block drop-shadow-md">
          {data.subtitle || "Spring / Summer 2024"}
        </span>
        <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 tracking-tight drop-shadow-lg leading-tight">
          {data.title || "New Collection"}
        </h1>
        <div className="flex gap-4 flex-col sm:flex-row">
          <button className="px-10 py-4 bg-white text-gray-900 text-sm font-bold uppercase tracking-widest hover:bg-gray-100 hover:scale-105 transition-transform duration-300">
            {data.ctaPrimary?.label || "Shop Now"}
          </button>
        </div>
      </div>
    </section>
  );
}
