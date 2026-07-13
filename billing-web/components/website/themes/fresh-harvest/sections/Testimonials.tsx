import React from 'react';
import { TestimonialsSection, WebsiteConfig } from '@/lib/website/types';
import { Quote, Star } from 'lucide-react';

export default function Testimonials({ data, config }: { data: TestimonialsSection['data'], config: WebsiteConfig }) {
  const defaultReviews = [
    { id: '1', text: 'The freshest vegetables I have ever bought! You can taste the difference. The delivery was prompt and the produce was perfectly ripe.', authorName: 'Priya Sharma', authorRole: 'Home Chef' },
    { id: '2', text: 'Finally found a place that delivers organic fruits. The subscription service is amazing. Highly recommend to all health-conscious families.', authorName: 'Rahul Verma', authorRole: 'Fitness Coach' },
    { id: '3', text: "I love that they use eco-friendly packaging. The quality is consistently excellent. Been ordering weekly for 3 months now!", authorName: 'Ananya Patel', authorRole: 'Regular Customer' },
  ];

  const reviews = data.reviews?.length ? data.reviews : defaultReviews;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="text-4xl font-extrabold text-green-900 tracking-tight mt-2 mb-4">
            {data.title || "What Our Customers Say"}
          </h2>
          {data.subtitle && <p className="text-green-700/60 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="bg-gradient-to-br from-green-50 to-white rounded-3xl p-8 border border-green-100 hover:shadow-xl transition-shadow">
              <Quote className="w-8 h-8 text-green-400/40 mb-6" />
              <div className="flex gap-1 mb-5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-green-800/70 leading-relaxed mb-8">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-4 pt-4 border-t border-green-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                  {review.authorName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-green-900">{review.authorName}</h4>
                  <p className="text-sm text-green-600">{review.authorRole || 'Verified Customer'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
