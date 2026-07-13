import React from 'react';
import { WebsiteConfig, WebsiteSection } from '@/lib/website/types';

import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Categories from './sections/Categories';
import FeaturedProducts from './sections/FeaturedProducts';
import PromoBanner from './sections/PromoBanner';
import Newsletter from './sections/Newsletter';
import Footer from './sections/Footer';

export default function FashionStoreLayout({ config, tenant, children }: { config: WebsiteConfig, tenant: any, children?: React.ReactNode }) {
  const sections = config.sections || [];

  const renderSection = (section: WebsiteSection) => {
    if (!section.isVisible) return null;

    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={section.data} config={config} />;
      case 'categories':
        return <Categories key={section.id} data={section.data as any} config={config} />;
      case 'featured-products':
        return <FeaturedProducts key={section.id} data={section.data as any} config={config} tenant={tenant} />;
      case 'promo-banner':
        return <PromoBanner key={section.id} data={section.data as any} config={config} />;
      case 'newsletter':
        return <Newsletter key={section.id} data={section.data as any} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={section.data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen bg-white flex flex-col"
      style={{ 
        '--theme-primary': config.appearance?.colors?.primary || '#111827',
        '--theme-secondary': config.appearance?.colors?.secondary || '#6b7280',
        '--theme-background': config.appearance?.colors?.background || '#ffffff',
        '--theme-text': config.appearance?.colors?.text || '#111827',
      } as React.CSSProperties}
    >
      <Navbar tenant={tenant} config={config} />
      
      <main className="flex-grow">
        {children ? children : sections.filter(s => s.type !== 'footer').sort((a, b) => a.order - b.order).map(renderSection)}
      </main>
      {sections.filter(s => s.type === 'footer').map(renderSection)}
    </div>
  );
}
