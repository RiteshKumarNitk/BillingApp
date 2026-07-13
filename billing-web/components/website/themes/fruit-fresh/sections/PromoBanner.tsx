import React from 'react';
import { PromoBannerSection, WebsiteConfig } from '@/lib/website/types';
import { Sparkles } from 'lucide-react';

export default function PromoBanner({ data, config }: { data: PromoBannerSection['data'], config: WebsiteConfig }) {
  return (
    <section id="offers" className="py-16 bg-gradient-to-r from-orange-500 via-orange-500 to-pink-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Sparkles className="w-10 h-10 mx-auto mb-4 text-white/80" />
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          {data.title || "Summer Special: 20% Off"}
        </h2>
        <p className="text-orange-100/90 text-lg mb-8 max-w-xl mx-auto">
          {data.subtitle || "Fresh mangoes, watermelons, and seasonal berries at unbeatable prices. Stock up on sunshine!"}
        </p>
        <button className="px-10 py-4 bg-white text-orange-600 font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all shadow-lg">
          {data.buttonText || "Grab The Deal"}
        </button>
      </div>
    </section>
  );
}
