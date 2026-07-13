import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Quote } from 'lucide-react';

export default function Testimonials({ data, config }: { data: TestimonialsSection['data'], config: WebsiteConfig }) {
  const defaultReviews = [
    {
      id: '1',
      text: "This place is great! Atmosphere is chill and cool but the staff is also really friendly. They know what they're doing and what they're talking about, and you can tell making the customers happy is their main priority.",
      authorName: "Savannah Nguyen",
      avatarUrl: "https://i.pravatar.cc/150?u=1"
    },
    {
      id: '2',
      text: "This place is great! Atmosphere is chill and cool but the staff is also really friendly. They know what they're doing and what they're talking about, and you can tell making the customers happy is their main priority.",
      authorName: "Savannah Nguyen",
      avatarUrl: "https://i.pravatar.cc/150?u=2"
    },
    {
      id: '3',
      text: "This place is great! Atmosphere is chill and cool but the staff is also really friendly. They know what they're doing and what they're talking about, and you can tell making the customers happy is their main priority.",
      authorName: "Savannah Nguyen",
      avatarUrl: "https://i.pravatar.cc/150?u=3"
    }
  ];

  const reviews = data.reviews?.length ? data.reviews : defaultReviews;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {data.title || "What Our Customer Says?"}
          </h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-colors">
              &lt;
            </button>
            <button className="w-10 h-10 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900 hover:opacity-90">
              &gt;
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
          {reviews.map(review => (
            <div key={review.id} className="min-w-[300px] md:min-w-[400px] bg-[var(--theme-background)] rounded-3xl p-8 snap-start flex flex-col">
              <Quote className="w-10 h-10 text-[var(--theme-primary)]/50 mb-6" />
              <p className="text-gray-600 leading-relaxed mb-8 flex-grow">"{review.text}"</p>
              <div className="flex items-center gap-4">
                <img src={review.avatarUrl} alt={review.authorName} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <h4 className="font-bold text-gray-900">{review.authorName}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
