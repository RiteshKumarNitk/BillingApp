import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Star } from 'lucide-react';

export default function Testimonials({ data, config }: { data: TestimonialsSection['data'], config: WebsiteConfig }) {
  const reviews = data.reviews || [];
  if (!reviews.length) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Happy Customers</span>
          <h2 className="text-4xl font-bold text-orange-900 tracking-tight mt-2 mb-4">
            {data.title || "What Fruit Lovers Say"}
          </h2>
          {data.subtitle && <p className="text-orange-700/50 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="bg-gradient-to-b from-orange-50 to-white rounded-3xl p-8 border border-orange-100/50 hover:shadow-xl transition-shadow">
              <div className="flex gap-1 mb-5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-orange-800/60 leading-relaxed mb-8">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-4 pt-4 border-t border-orange-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {review.authorName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-orange-900">{review.authorName}</h4>
                  <p className="text-sm text-orange-500">{review.authorRole || 'Happy Customer'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
