import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';
import { Leaf } from 'lucide-react';

export default function Features({ data, config }: { data: FeaturesSection['data'], config: WebsiteConfig }) {
  const features = data.features || [];
  if (!features.length) return null;

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-4xl font-extrabold text-green-900 tracking-tight mt-2 mb-4">
            {data.title || "Nature's Best, Delivered"}
          </h2>
          {data.subtitle && <p className="text-green-700/60 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.slice(0, 4).map((feat, idx) => (
            <div key={idx} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-green-600 group-hover:from-green-500 group-hover:to-green-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg text-2xl">
                {feat.icon ? <span>{feat.icon}</span> : <Leaf className="w-7 h-7" />}
              </div>
              <h3 className="text-lg font-bold text-green-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-green-700/60 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
