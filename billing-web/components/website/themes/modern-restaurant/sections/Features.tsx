import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';

export default function Features({ data, config }: { data: FeaturesSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 px-4 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{data.title}</h2>
          {data.subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {(data.features || []).map((feature, idx) => (
            <div 
              key={idx} 
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center"
            >
              {feature.icon && (
                <div className="w-16 h-16 mx-auto mb-6 bg-red-50 text-[var(--theme-primary)] flex items-center justify-center rounded-full text-2xl">
                  {/* Since we don't have a dynamic icon renderer yet, just render emoji or placeholder */}
                  {feature.icon}
                </div>
              )}
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
