import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Quote } from 'lucide-react';

export default function Testimonials({ data, config }: { data: TestimonialsSection['data'], config: WebsiteConfig }) {
  const reviews = data.reviews || [];
  if (!reviews.length) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'What People Say'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="rounded-3xl p-8" style={{ backgroundColor: 'var(--theme-background)' }}>
              <Quote className="w-8 h-8 mb-4" style={{ color: 'var(--theme-accent)' }} />
              <p className="text-gray-700 leading-relaxed mb-6">"{review.text}"</p>
              <div className="flex items-center gap-3">
                {review.avatarUrl && <img src={review.avatarUrl} alt={review.authorName} className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <p className="font-bold text-gray-900 text-sm">{review.authorName}</p>
                  {review.authorRole && <p className="text-xs text-gray-500">{review.authorRole}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
