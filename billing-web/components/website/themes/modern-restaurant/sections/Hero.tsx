import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';

export default function Hero({ data, config }: { data: HeroSection['data'], config: WebsiteConfig }) {
  return (
    <section 
      className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      {data.backgroundImageUrl ? (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${data.backgroundImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/50" /> {/* Overlay */}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gray-900" />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {data.title}
        </h1>
        
        {data.subtitle && (
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">
            {data.subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {data.ctaPrimary && (
            <Link 
              href={data.ctaPrimary.url}
              className="px-8 py-4 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {data.ctaPrimary.label}
            </Link>
          )}
          {data.ctaSecondary && (
            <Link 
              href={data.ctaSecondary.url}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors w-full sm:w-auto"
            >
              {data.ctaSecondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
