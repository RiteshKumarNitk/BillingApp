import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';
import { Sparkle } from 'lucide-react';

export type FeaturesStyle = 'cards' | 'luxury';

export default function Features({ data, variant = 'cards' }: { data: FeaturesSection['data']; config: WebsiteConfig; variant?: FeaturesStyle }) {
  if (variant === 'luxury') {
    const features = data.features || [];
    return (
      <section className="py-20 bg-[var(--theme-background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-[var(--theme-primary)] opacity-10 rounded-full transform -translate-x-4 translate-y-4" />
              <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Chef" className="relative rounded-t-[200px] rounded-b-xl w-full max-w-md mx-auto object-cover h-[500px] shadow-xl border-8 border-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">{data.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-10 max-w-lg">{data.subtitle}</p>
              {features.length > 0 && (
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-10">
                  {features.slice(0, 4).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900 shadow-sm flex-shrink-0 text-sm">
                        {feat.icon || <Sparkle className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-gray-800">{feat.title}</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-lg">About Us</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 'cards' (modern-restaurant's original look)
  return (
    <section className="py-20 px-4 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{data.title}</h2>
          {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {(data.features || []).map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center">
              {feature.icon && (
                <div className="w-16 h-16 mx-auto mb-6 bg-red-50 text-[var(--theme-primary)] flex items-center justify-center rounded-full text-2xl">{feature.icon}</div>
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
