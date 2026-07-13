import React from 'react';
import { NewsletterSection, WebsiteConfig } from '@/lib/website/types';

export default function Newsletter({ data, config }: { data: NewsletterSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-serif text-gray-900 mb-4">
          {data.title || "Join Our Newsletter"}
        </h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
          {data.subtitle || "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals."}
        </p>
        
        <form className="flex flex-col sm:flex-row max-w-xl mx-auto border-b border-gray-900 pb-2">
          <input 
            type="email" 
            placeholder={data.placeholderText || "Enter your email"} 
            className="flex-1 bg-transparent border-none focus:ring-0 px-0 py-2 text-gray-900 placeholder-gray-400 outline-none"
            required
          />
          <button type="submit" className="uppercase tracking-widest text-xs font-bold text-gray-900 px-4 py-2 hover:text-gray-600 transition-colors">
            {data.buttonText || "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
