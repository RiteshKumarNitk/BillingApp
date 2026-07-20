import React from 'react';
import { WebsiteConfig, WebsiteSection, HeroSection, FeaturesSection, GallerySection, FooterSection, CategoriesSection, FeaturedProductsSection, NewsletterSection, TestimonialsSection } from '@/lib/website/types';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Categories from './sections/Categories';
import FeaturedProducts from './sections/FeaturedProducts';
import Features from './sections/Features';
import Gallery from './sections/Gallery';
import Testimonials from './sections/Testimonials';
import Newsletter from './sections/Newsletter';
import Footer from './sections/Footer';

interface LayoutProps {
  config: WebsiteConfig;
  tenant: any;
}

export default function FreshHarvestLayout({ config, tenant }: LayoutProps) {
  const sections = [...(config.sections || [])]
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={(section as HeroSection).data} config={config} tenant={tenant} />;
      case 'categories':
        return <Categories key={section.id} data={(section as CategoriesSection).data} config={config} tenant={tenant} />;
      case 'featured-products':
        return <FeaturedProducts key={section.id} data={(section as FeaturedProductsSection).data} config={config} tenant={tenant} />;
      case 'features':
        return <Features key={section.id} data={(section as FeaturesSection).data} config={config} />;
      case 'gallery':
        return <Gallery key={section.id} data={(section as GallerySection).data} config={config} />;
      case 'testimonials':
        return <Testimonials key={section.id} data={(section as TestimonialsSection).data} config={config} />;
      case 'newsletter':
        return <Newsletter key={section.id} data={(section as NewsletterSection).data} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={(section as FooterSection).data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  const primaryColor = config.appearance?.colors?.primary || '#22c55e';
  const backgroundColor = config.appearance?.colors?.background || '#f0fdf4';
  const textColor = config.appearance?.colors?.text || '#166534';

  return (
    <div
      className="site-shell min-h-screen flex flex-col"
      style={{
        backgroundColor,
        color: textColor,
        '--theme-primary': primaryColor,
        '--theme-secondary': config.appearance?.colors?.secondary || '#16a34a',
        '--theme-accent': config.appearance?.colors?.accent || primaryColor,
        '--theme-font-heading': config.appearance?.typography?.headingFont || undefined,
        '--theme-font-body': config.appearance?.typography?.bodyFont || '"Inter", "Plus Jakarta Sans", sans-serif',
      } as React.CSSProperties}
    >
      <Navbar tenant={tenant} config={config} />
      <main className="flex-grow">
        {sections.map(renderSection)}
      </main>
    </div>
  );
}
