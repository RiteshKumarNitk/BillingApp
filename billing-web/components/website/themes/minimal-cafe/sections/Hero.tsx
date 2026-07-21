import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';

export default function Hero({ data, config }: { data: HeroSection['data'], config: WebsiteConfig }) {
  return (
    <section className="relative w-full py-28 md:py-40 px-6 overflow-hidden">
      {data.backgroundImageUrl && (
        <div className="absolute inset-0 z-0 opacity-10">
          <img src={data.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="w-10 h-px bg-[var(--theme-primary)] mx-auto mb-8" />
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]" style={{ color: 'var(--theme-primary)' }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed">
            {data.subtitle}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {data.ctaPrimary && (
            <Link
              href={data.ctaPrimary.url}
              className="px-8 py-3.5 bg-[var(--theme-primary)] text-white text-sm font-medium tracking-wide uppercase hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {data.ctaPrimary.label}
            </Link>
          )}
          {data.ctaSecondary && (
            <Link
              href={data.ctaSecondary.url}
              className="px-8 py-3.5 border border-black/15 text-sm font-medium tracking-wide uppercase hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-colors w-full sm:w-auto"
            >
              {data.ctaSecondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
