import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Star } from 'lucide-react';

export default function Testimonials({ data, config }: { data: TestimonialsSection['data'], config: WebsiteConfig }) {
  const defaultReviews = [
    { id: '1', text: 'Switching to organic was the best decision for my family. The quality and freshness are unmatched. Highly recommended!', authorName: 'Meera Joshi', authorRole: 'Nutritionist' },
    { id: '2', text: 'I love that I can trust everything here is genuinely organic. The delivery is always on time and the produce is exceptional.', authorName: 'Arjun Nair', authorRole: 'Yoga Instructor' },
    { id: '3', text: 'The subscription box is perfect for my weekly needs. Great variety of seasonal organic produce at fair prices.', authorName: 'Kavita Desai', authorRole: 'Home Baker' },
  ];

  const reviews = data.reviews?.length ? data.reviews : defaultReviews;

  return (
    <section className="py-24 bg-[var(--theme-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--theme-primary)] font-semibold text-sm uppercase tracking-widest">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight mt-3 mb-4">
            {data.title || "What Our Community Says"}
          </h2>
          {data.subtitle && <p className="text-stone-500 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="bg-white rounded-3xl p-8 border border-amber-100/50 relative">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-stone-600 leading-relaxed mb-8 italic">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--theme-primary)] to-purple-600 flex items-center justify-center text-white font-bold text-xl font-serif">
                  {review.authorName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800">{review.authorName}</h4>
                  <p className="text-sm text-stone-500">{review.authorRole || 'Verified Customer'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
