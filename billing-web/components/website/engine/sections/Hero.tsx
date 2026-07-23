import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { Search, Utensils, Coffee, Pizza, Cookie } from 'lucide-react';

export type HeroStyle = 'pill' | 'minimal' | 'overlay' | 'luxury' | 'fullscreen';

interface HeroProps {
  data: HeroSection['data'];
  config: WebsiteConfig;
  tenant?: any;
  variant?: HeroStyle;
}

export default function Hero({ data, config, tenant, variant = 'pill' }: HeroProps) {
  if (variant === 'minimal') {
    return (
      <section className="relative w-full py-28 md:py-40 px-6 overflow-hidden">
        {data.backgroundImageUrl && (
          <div className="absolute inset-0 z-0 opacity-10">
            <img src={data.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-10 h-px bg-[var(--theme-primary)] mx-auto mb-8" />
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]" style={{ color: 'var(--theme-primary)' }}>{data.title}</h1>
          {data.subtitle && <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed">{data.subtitle}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {data.ctaPrimary && (
              <Link href={data.ctaPrimary.url} className="px-8 py-3.5 bg-[var(--theme-primary)] text-white text-sm font-medium tracking-wide uppercase hover:opacity-90 transition-opacity w-full sm:w-auto">
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary && (
              <Link href={data.ctaSecondary.url} className="px-8 py-3.5 border border-black/15 text-sm font-medium tracking-wide uppercase hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-colors w-full sm:w-auto">
                {data.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'overlay') {
    return (
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {data.backgroundImageUrl ? (
          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.backgroundImageUrl})` }}>
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gray-900" />
        )}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{data.title}</h1>
          {data.subtitle && <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">{data.subtitle}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {data.ctaPrimary && (
              <Link href={data.ctaPrimary.url} className="px-8 py-4 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:opacity-90 transition-opacity w-full sm:w-auto">
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary && (
              <Link href={data.ctaSecondary.url} className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors w-full sm:w-auto">
                {data.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'luxury') {
    // Same branding priority everywhere (mobile app / cafe cards use the same chain via
    // lib/cafes/heroImage.ts): a dedicated Cover Image wins, then Shop Front, then whatever this
    // section's own background was manually set to, then the first Gallery photo, and only then
    // the hardcoded placeholder.
    const galleryFirst = (config.sections?.find((s: any) => s.type === 'gallery') as any)?.data?.images?.[0]?.url ?? null;
    const coverImage = tenant?.coverImageUrl || tenant?.shopFrontImageUrl || data.backgroundImageUrl || galleryFirst
      || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    return (
      <section className="relative w-full min-h-[85vh] flex items-center pt-20 pb-16 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-500 opacity-5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1 text-center md:text-left mt-10 md:mt-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
              {data.title} <span className="inline-block text-3xl md:text-5xl">😋</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto md:mx-0 leading-relaxed">{data.subtitle}</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link href={data.ctaPrimary?.url || '#menu'} className="px-8 py-3.5 bg-[var(--theme-primary)] text-gray-900 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center">
                {data.ctaPrimary?.label || 'Explore Food'}
              </Link>
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                <input type="text" placeholder="Search" className="pl-12 pr-6 py-3.5 border-2 border-gray-200 rounded-full w-full sm:w-48 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-all bg-white/50 backdrop-blur-sm font-medium" />
              </div>
            </div>
          </div>
          <div className="flex-1 relative flex justify-center items-center h-[400px] md:h-[600px] w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/10 to-transparent rounded-full transform rotate-12 scale-90 -z-10 blur-xl" />
            <div className="absolute w-[80%] h-[80%] rounded-full border border-[var(--theme-primary)]/20 scale-110" />
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full p-2 bg-white shadow-2xl z-10">
              <img src={coverImage} alt="Delicious food" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="absolute top-[10%] right-[5%] bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer z-20">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center"><Utensils className="w-4 h-4" /></div>
              <span className="font-bold text-sm text-gray-800">Dishes</span>
            </div>
            <div className="absolute bottom-[20%] right-0 bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer z-20">
              <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><Cookie className="w-4 h-4" /></div>
              <span className="font-bold text-sm text-gray-800">Dessert</span>
            </div>
            <div className="absolute bottom-[10%] left-[10%] bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer z-20">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><Pizza className="w-4 h-4" /></div>
              <span className="font-bold text-sm text-gray-800">Snacks</span>
            </div>
            <div className="absolute top-[20%] left-0 bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:scale-110 transition-transform cursor-pointer z-20">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><Coffee className="w-4 h-4" /></div>
              <span className="font-bold text-sm text-gray-800">Drinks</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
        {data.backgroundImageUrl ? (
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${data.backgroundImageUrl})` }} />
        ) : (
          <div className="absolute inset-0 z-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, var(--theme-primary) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        )}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--theme-background)] via-transparent to-[var(--theme-background)]/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: 'var(--theme-primary)' }} />
          <h1 className="text-5xl md:text-7xl font-semibold mb-6 leading-[1.1]" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}>
            {data.title}
          </h1>
          {data.subtitle && <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed opacity-70" style={{ color: 'var(--theme-text)' }}>{data.subtitle}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {data.ctaPrimary && (
              <Link href={data.ctaPrimary.url} className="px-8 py-4 rounded-full font-semibold text-center transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-background)' }}>
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary && (
              <Link href={data.ctaSecondary.url} className="px-8 py-4 rounded-full font-semibold text-center border transition-opacity hover:opacity-80" style={{ borderColor: 'var(--theme-secondary)', color: 'var(--theme-secondary)' }}>
                {data.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 'pill' — theme-colored full-bleed hero with badge (modern-coffee's original look)
  return (
    <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden" style={{ backgroundColor: 'var(--theme-primary)' }}>
      {data.backgroundImageUrl && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${data.backgroundImageUrl})` }} />}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="max-w-xl">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-6" style={{ backgroundColor: 'var(--theme-accent)' }}>Freshly Made Daily</span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.05]">{data.title}</h1>
          {data.subtitle && <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">{data.subtitle}</p>}
          <div className="flex flex-col sm:flex-row gap-4">
            {data.ctaPrimary && (
              <Link href={data.ctaPrimary.url} className="px-8 py-4 rounded-full font-bold text-center hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-primary)' }}>
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary && (
              <Link
                href={data.ctaSecondary.url}
                className="px-8 py-4 rounded-full font-bold text-center border-2 text-white hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--theme-secondary)', backgroundColor: 'var(--theme-secondary)' }}
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
