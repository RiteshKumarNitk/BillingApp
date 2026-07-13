import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';
import { Shield, Sprout, Heart, Globe } from 'lucide-react';

export default function Features({ data, config }: { data: FeaturesSection['data'], config: WebsiteConfig }) {
  const defaultFeatures = [
    { title: 'Certified Organic', description: 'All our products are certified organic by leading agricultural authorities.', icon: Shield },
    { title: 'Farm Direct', description: 'Sourced directly from local organic farms — no middlemen, no compromises.', icon: Sprout },
    { title: 'Health First', description: 'Packed with nutrients, free from pesticides, GMOs, and artificial additives.', icon: Heart },
    { title: 'Sustainable', description: 'Eco-friendly packaging and practices to protect our planet for future generations.', icon: Globe },
  ];

  const features = data.features?.length ? data.features : defaultFeatures;

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--theme-primary)] font-semibold text-sm uppercase tracking-widest">Our Promise</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight mt-3 mb-4">
            {data.title || "Nature's Finest, Delivered With Care"}
          </h2>
          {data.subtitle && <p className="text-stone-500 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.slice(0, 4).map((feat, idx) => (
            <div key={idx} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-200/50 flex items-center justify-center text-[var(--theme-primary)] group-hover:bg-[var(--theme-primary)] group-hover:text-white transition-all duration-300 shadow-sm">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-3">{feat.title}</h3>
              <p className="text-stone-500 leading-relaxed text-sm">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
