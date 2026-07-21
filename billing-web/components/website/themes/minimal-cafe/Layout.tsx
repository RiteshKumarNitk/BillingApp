import React from 'react';
import { WebsiteConfig, WebsiteSection, HeroSection, MenuGridSection, GallerySection, FooterSection } from '@/lib/website/types';
import Hero from './sections/Hero';
import MenuGrid from './sections/MenuGrid';
import Gallery from './sections/Gallery';
import Footer from './sections/Footer';
import Navbar from './sections/Navbar';

interface LayoutProps {
  config: WebsiteConfig;
  tenant: any;
  children?: React.ReactNode;
}

export default function MinimalCafeLayout({ config, tenant, children }: LayoutProps) {
  const sections = [...(config.sections || [])]
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={(section as HeroSection).data} config={config} />;
      case 'menu-grid':
        return <MenuGrid key={section.id} data={(section as MenuGridSection).data} config={config} tenant={tenant} />;
      case 'gallery':
        return <Gallery key={section.id} data={(section as GallerySection).data} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={(section as FooterSection).data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  const primaryColor = config.appearance?.colors?.primary || '#2D2A26';
  const backgroundColor = config.appearance?.colors?.background || '#FAFAF8';
  const textColor = config.appearance?.colors?.text || '#2D2A26';

  return (
    <div
      className="site-shell min-h-screen flex flex-col"
      style={{
        backgroundColor,
        color: textColor,
        '--theme-primary': primaryColor,
        '--theme-background': backgroundColor,
        '--theme-accent': config.appearance?.colors?.accent || primaryColor,
        '--theme-font-heading': config.appearance?.typography?.headingFont || undefined,
        '--theme-font-body': config.appearance?.typography?.bodyFont || undefined,
      } as React.CSSProperties}
    >
      <Navbar tenant={tenant} config={config} />
      <main className="flex-grow">
        {children ? children : sections.filter(s => s.type !== 'footer').map(renderSection)}
      </main>
      {sections.filter(s => s.type === 'footer').map(renderSection)}
    </div>
  );
}
