import React from 'react';
import { NewsletterSection, WebsiteConfig } from '@/lib/website/types';
import { Mail, Bell } from 'lucide-react';

export default function Newsletter({ data, config }: { data: NewsletterSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Bell className="w-12 h-12 mx-auto mb-6 text-green-200" />
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          {data.title || "Get Fresh Updates"}
        </h2>
        <p className="text-green-100/80 mb-10 max-w-xl mx-auto">
          {data.subtitle || "Subscribe to receive weekly updates on fresh arrivals, seasonal offers, and healthy recipes."}
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
            <input
              type="email"
              placeholder={data.placeholderText || "Your email address"}
              className="w-full pl-12 pr-4 py-3.5 rounded-full border-0 focus:ring-2 focus:ring-green-300 bg-white/95 text-green-900 placeholder-green-400 shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3.5 bg-white text-green-700 font-bold rounded-full hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl"
          >
            {data.buttonText || "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
