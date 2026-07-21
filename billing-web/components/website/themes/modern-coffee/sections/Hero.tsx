import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';

export default function Hero({ data, config }: { data: HeroSection['data'], config: WebsiteConfig }) {
  return (
    <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden" style={{ backgroundColor: 'var(--theme-primary)' }}>
      {data.backgroundImageUrl ? (
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${data.backgroundImageUrl})` }} />
      ) : null}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="max-w-xl">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ backgroundColor: 'var(--theme-accent)' }}>
            Freshly Brewed Daily
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.05]">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
              {data.subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            {data.ctaPrimary && (
              <Link
                href={data.ctaPrimary.url}
                className="px-8 py-4 rounded-full font-bold text-center hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-primary)' }}
              >
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary && (
              <Link
                href={data.ctaSecondary.url}
                className="px-8 py-4 rounded-full font-bold text-center border-2 border-white/40 text-white hover:bg-white/10 transition-colors"
              >
                {data.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
