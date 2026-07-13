import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';

export default function Hero({ data, config, tenant }: { data: HeroSection['data'], config: WebsiteConfig, tenant: any }) {
  const bgImage = data.backgroundImageUrl || tenant?.coverImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';

  return (
    <section id="home" className="relative w-full min-h-[85vh] flex items-center overflow-hidden bg-stone-100">
      <div className="absolute inset-0">
        <img src={bgImage} alt="Organic products" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-background)] via-[var(--theme-background)]/80 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-[var(--theme-primary)]/20">
            <Leaf className="w-4 h-4" />
            100% Certified Organic
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
            {data.title || "Naturally Good For You"}
          </h1>

          <p className="text-lg text-stone-600 mb-10 max-w-md leading-relaxed">
            {data.subtitle || "Pure, organic products sourced directly from certified farms. No chemicals, no additives — just nature's goodness."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={data.ctaPrimary?.url || `/menu/${tenant?.id}/shop`}
              className="px-8 py-4 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
            >
              {data.ctaPrimary?.label || "Explore Products"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={data.ctaSecondary?.url || "#about"}
              className="px-8 py-4 bg-white text-stone-800 font-semibold rounded-full hover:shadow-lg transition-all border border-stone-200 text-center"
            >
              {data.ctaSecondary?.label || "Our Story"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
