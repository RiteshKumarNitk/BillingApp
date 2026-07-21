import React from 'react';
import { WebsiteConfig, WebsiteSection, HeroSection, MenuGridSection, TestimonialsSection, GallerySection, FooterSection, TodaysSpecialSection, GoogleMapSection } from '@/lib/website/types';
import Hero from './sections/Hero';
import MenuGrid from './sections/MenuGrid';
import Testimonials from './sections/Testimonials';
import Gallery from './sections/Gallery';
import Footer from './sections/Footer';
import Navbar from './sections/Navbar';
import TodaysSpecial from './sections/TodaysSpecial';
import GoogleMap from './sections/GoogleMap';

interface LayoutProps {
  config: WebsiteConfig;
  tenant: any;
  children?: React.ReactNode;
}

export default function ModernCoffeeLayout({ config, tenant, children }: LayoutProps) {
  const sections = [...(config.sections || [])]
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={(section as HeroSection).data} config={config} />;
      case 'menu-grid':
        return <MenuGrid key={section.id} data={(section as MenuGridSection).data} config={config} tenant={tenant} />;
      case 'todays-special':
        return <TodaysSpecial key={section.id} data={(section as TodaysSpecialSection).data} config={config} tenant={tenant} />;
      case 'google-map':
        return <GoogleMap key={section.id} data={(section as GoogleMapSection).data} config={config} tenant={tenant} />;
      case 'testimonials':
        return <Testimonials key={section.id} data={(section as TestimonialsSection).data} config={config} />;
      case 'gallery':
        return <Gallery key={section.id} data={(section as GallerySection).data} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={(section as FooterSection).data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  const primaryColor = config.appearance?.colors?.primary || '#6F4E37';
  const backgroundColor = config.appearance?.colors?.background || '#FFF8F0';
  const textColor = config.appearance?.colors?.text || '#3B2A20';

  return (
    <div
      className="site-shell min-h-screen flex flex-col"
      style={{
        backgroundColor,
        color: textColor,
        '--theme-primary': primaryColor,
        '--theme-background': backgroundColor,
        '--theme-accent': config.appearance?.colors?.accent || '#D4A24C',
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
