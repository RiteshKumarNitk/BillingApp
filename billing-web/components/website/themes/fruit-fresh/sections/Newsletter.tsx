import React from 'react';
import { NewsletterSection, WebsiteConfig } from '@/lib/website/types';
import { Cherry } from 'lucide-react';

export default function Newsletter({ data, config }: { data: NewsletterSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 bg-gradient-to-r from-orange-900 to-orange-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Cherry className="w-12 h-12 mx-auto mb-6 text-orange-300" />
        <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
          {data.title || "Get The Juicy Details"}
        </h2>
        <p className="text-orange-200/80 mb-10 max-w-lg mx-auto">
          {data.subtitle || "Subscribe for seasonal fruit alerts, recipe ideas, and exclusive discounts. Freshness delivered to your inbox!"}
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder={data.placeholderText || "Enter your email"} className="flex-1 px-5 py-3.5 rounded-full bg-orange-700/50 border border-orange-600/50 text-white placeholder-orange-300/60 focus:ring-2 focus:ring-orange-400 outline-none" required />
          <button type="submit" className="px-8 py-3.5 bg-white text-orange-700 font-bold rounded-full hover:shadow-lg transition-all">
            {data.buttonText || "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
