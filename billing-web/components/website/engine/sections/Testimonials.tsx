import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Quote } from 'lucide-react';

export type TestimonialsStyle = 'grid' | 'carousel';

export default function Testimonials({ data, variant = 'grid' }: { data: TestimonialsSection['data']; config: WebsiteConfig; variant?: TestimonialsStyle }) {
  const reviews = data.reviews || [];
  if (!reviews.length) return null;

  if (variant === 'carousel') {
    return (
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{data.title || 'What Our Customer Says?'}</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-colors">‹</button>
              <button className="w-10 h-10 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900 hover:opacity-90">›</button>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
            {reviews.map((review) => (
              <div key={review.id} className="min-w-[300px] md:min-w-[400px] bg-[var(--theme-background)] rounded-3xl p-8 snap-start flex flex-col">
                <Quote className="w-10 h-10 text-[var(--theme-primary)]/50 mb-6" />
                <p className="text-gray-600 leading-relaxed mb-8 flex-grow">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  {review.avatarUrl && <img src={review.avatarUrl} alt={review.authorName} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />}
                  <div><h4 className="font-bold text-gray-900">{review.authorName}</h4></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 'grid' (modern-coffee's original look)
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>{data.title || 'What People Say'}</h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review) => (
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
