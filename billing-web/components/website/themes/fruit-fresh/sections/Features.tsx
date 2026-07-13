import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';
import { Droplets, Sun, Heart, Truck } from 'lucide-react';

export default function Features({ data, config }: { data: FeaturesSection['data'], config: WebsiteConfig }) {
  const defaultFeatures = [
    { title: 'Orchard Fresh', description: 'Picked at peak ripeness and delivered within 24 hours for maximum flavor.', icon: Sun },
    { title: 'Hand Selected', description: 'Every fruit is carefully handpicked and quality-checked by our experts.', icon: Heart },
    { title: 'Stay Fresh Longer', description: 'Optimal storage and quick delivery ensure your fruits stay fresh for days.', icon: Droplets },
    { title: 'Doorstep Delivery', description: 'Free delivery on all orders. Carefully packed to prevent any damage.', icon: Truck },
  ];

  const features = data.features?.length ? data.features : defaultFeatures;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-4xl font-bold text-orange-900 tracking-tight mt-2 mb-4">
            {data.title || "The Freshest Promise"}
          </h2>
          {data.subtitle && <p className="text-orange-700/50 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.slice(0, 4).map((feat, idx) => (
            <div key={idx} className="text-center p-8 rounded-3xl bg-gradient-to-b from-orange-50 to-white border border-orange-100/50 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-50 flex items-center justify-center text-orange-500">
                <Sun className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-orange-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-orange-700/60 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
