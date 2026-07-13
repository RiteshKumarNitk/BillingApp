import React from 'react';
import { WebsiteConfig, WebsiteSection, HeroSection, FeaturesSection, MenuGridSection, PopularDishesSection, ReservationSection, TestimonialsSection, TeamSection, AppDownloadSection, FooterSection } from '@/lib/website/types';
import Hero from './sections/Hero';
import PopularDishes from './sections/PopularDishes';
import Features from './sections/Features';
import MenuGrid from './sections/MenuGrid';
import Reservation from './sections/Reservation';
import Testimonials from './sections/Testimonials';
import Team from './sections/Team';
import AppDownload from './sections/AppDownload';
import Footer from './sections/Footer';
import Navbar from './sections/Navbar';

interface LayoutProps {
  config: WebsiteConfig;
  tenant: any;
  children?: React.ReactNode;
}

export default function PremiumFoodLayout({ config, tenant, children }: LayoutProps) {
  // Sort sections by order
  const sections = [...(config.sections || [])]
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderSection = (section: WebsiteSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero key={section.id} data={(section as HeroSection).data} config={config} tenant={tenant} />;
      case 'popular-dishes':
        return <PopularDishes key={section.id} data={(section as PopularDishesSection).data} config={config} tenant={tenant} />;
      case 'features':
        return <Features key={section.id} data={(section as FeaturesSection).data} config={config} />;
      case 'menu-grid':
        return <MenuGrid key={section.id} data={(section as MenuGridSection).data} config={config} tenant={tenant} />;
      case 'reservation':
        return <Reservation key={section.id} data={(section as ReservationSection).data} config={config} />;
      case 'testimonials':
        return <Testimonials key={section.id} data={(section as TestimonialsSection).data} config={config} />;
      case 'team':
        return <Team key={section.id} data={(section as TeamSection).data} config={config} />;
      case 'app-download':
        return <AppDownload key={section.id} data={(section as AppDownloadSection).data} config={config} />;
      case 'footer':
        return <Footer key={section.id} data={(section as FooterSection).data} config={config} tenant={tenant} />;
      default:
        return null;
    }
  };

  const primaryColor = config.appearance?.colors?.primary || '#EAB308';
  const backgroundColor = config.appearance?.colors?.background || '#FAF9F5';
  const textColor = config.appearance?.colors?.text || '#1F2937';

  return (
    <div 
      className="min-h-screen flex flex-col" 
      style={{ 
        backgroundColor, 
        color: textColor,
        '--theme-primary': primaryColor,
        fontFamily: '"Nunito", "Quicksand", sans-serif'
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
