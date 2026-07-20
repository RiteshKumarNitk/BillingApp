import React from 'react';
import { FeaturesSection, WebsiteConfig } from '@/lib/website/types';
import { Sparkle } from 'lucide-react';

export default function Features({ data, config }: { data: FeaturesSection['data'], config: WebsiteConfig }) {
  const features = data.features || [];

  return (
    <section className="py-20 bg-[var(--theme-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-[var(--theme-primary)] opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
             <img 
               src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="Chef" 
               className="relative rounded-t-[200px] rounded-b-xl w-full max-w-md mx-auto object-cover h-[500px] shadow-xl border-8 border-white"
             />
          </div>
          
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              {data.title || "We Are More Than Multiple Service"}
            </h2>
            
            <p className="text-gray-600 leading-relaxed mb-10 max-w-lg">
              {data.subtitle || "This is a type of restaurant which typically serves food and drinks, in addition to light refreshments such as baked goods or snacks. The term comes from the ranch word meaning food."}
            </p>
            
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

            <button className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-lg">
              About Us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
