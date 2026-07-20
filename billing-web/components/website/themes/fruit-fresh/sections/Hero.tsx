import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';

export default function Hero({ data, config, tenant }: { data: HeroSection['data'], config: WebsiteConfig, tenant: any }) {
  const bgImage = data.backgroundImageUrl || tenant?.coverImageUrl || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';

  return (
    <section id="home" className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-pink-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-l from-orange-900/40 via-orange-900/20 to-transparent z-10" />
        <img src={bgImage} alt="Fresh fruits" className="w-full h-full object-cover" />
      </div>

      <div className="absolute top-10 right-10 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-white/40">
            <Sparkles className="w-4 h-4" />
            100% Fresh & Natural
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
            {data.title || "Nature's Sweetest Harvest"}
          </h1>

          <p className="text-lg text-orange-50/90 mb-10 max-w-lg leading-relaxed">
            {data.subtitle || "Handpicked, perfectly ripe fruits delivered fresh from orchards to your doorstep. Taste the sunshine in every bite."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={data.ctaPrimary?.url || `/site/${tenant?.id}/shop`}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 justify-center"
            >
              <ShoppingBag className="w-5 h-5" />
              {data.ctaPrimary?.label || "Shop Fruits"}
            </Link>
            <Link
              href={data.ctaSecondary?.url || "#categories"}
              className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full hover:bg-white/30 transition-all border border-white/40 text-center"
            >
              {data.ctaSecondary?.label || "Explore"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
