import React from 'react';
import { NewsletterSection, WebsiteConfig } from '@/lib/website/types';
import { Sprout } from 'lucide-react';

export default function Newsletter({ data, config }: { data: NewsletterSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Sprout className="w-10 h-10 mx-auto mb-6 text-[var(--theme-primary)]" />
        <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-4">
          {data.title || "Join The Organic Movement"}
        </h2>
        <p className="text-stone-400 mb-10 max-w-lg mx-auto">
          {data.subtitle || "Subscribe for organic tips, seasonal recipes, and exclusive offers delivered to your inbox."}
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
          <input
            type="email"
            placeholder={data.placeholderText || "Your email"}
            className="flex-1 px-5 py-3.5 rounded-full bg-stone-800 border border-stone-700 text-white placeholder-stone-500 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none"
            required
          />
          <button
            type="submit"
            className="px-8 py-3.5 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:shadow-lg hover:opacity-90 transition-all"
          >
            {data.buttonText || "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
