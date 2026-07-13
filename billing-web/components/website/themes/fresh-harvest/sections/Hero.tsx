import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { ShoppingCart, ArrowRight, Wheat } from 'lucide-react';

export default function Hero({ data, config, tenant }: { data: HeroSection['data'], config: WebsiteConfig, tenant: any }) {
  const bgImage = data.backgroundImageUrl || tenant?.coverImageUrl || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';

  return (
    <section id="home" className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/70 via-green-900/50 to-transparent z-10" />
        <img src={bgImage} alt="Fresh produce" className="w-full h-full object-cover" />
      </div>

      <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/30">
            <Wheat className="w-4 h-4" />
            Farm Fresh Direct
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            {data.title || "Fresh From Farm To Your Table"}
          </h1>

          <p className="text-lg md:text-xl text-green-50/90 mb-10 max-w-lg leading-relaxed">
            {data.subtitle || "Handpicked vegetables and fruits delivered fresh from local farms. Taste the difference of farm-fresh produce."}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={data.ctaPrimary?.url || `/menu/${tenant?.id}/shop`}
              className="px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
              {data.ctaPrimary?.label || "Shop Fresh"}
            </Link>
            <Link
              href={data.ctaSecondary?.url || "#about"}
              className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full hover:bg-white/30 transition-all border border-white/40 w-full sm:w-auto text-center"
            >
              {data.ctaSecondary?.label || "Learn More"}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ArrowRight className="w-6 h-6 text-white/60 rotate-90" />
      </div>
    </section>
  );
}
