import React from 'react';
import { WebsiteConfig, WebsiteSection, HeroSection, FeaturesSection, GallerySection, FooterSection } from '@/lib/website/types';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Gallery from './sections/Gallery';
import Footer from './sections/Footer';
import Navbar from './sections/Navbar';

interface LayoutProps {
  config: WebsiteConfig;
  tenant: any;
}

export default function ModernRestaurantLayout({ config, tenant }: LayoutProps) {
  // Sort sections by order
  const sections = [...(config.sections || [])]
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={(section as HeroSection).data} config={config} />;
      case 'features':
        return <Features key={section.id} data={(section as FeaturesSection).data} config={config} />;
      case 'gallery':
        return <Gallery key={section.id} data={(section as GallerySection).data} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={(section as FooterSection).data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  const primaryColor = config.appearance?.colors?.primary || '#ef4444';
  const backgroundColor = config.appearance?.colors?.background || '#ffffff';
  const textColor = config.appearance?.colors?.text || '#1f2937';

  return (
    <div 
      className="min-h-screen flex flex-col font-sans" 
      style={{ 
        backgroundColor, 
        color: textColor,
        '--theme-primary': primaryColor,
      } as React.CSSProperties}
    >
      <Navbar tenant={tenant} config={config} />
      <main className="flex-grow">
        {sections.map(renderSection)}
      </main>
    </div>
  );
}
