import React from 'react';
import { ReservationSection, WebsiteConfig } from '@/lib/website/types';

export default function Reservation({ data, config }: { data: ReservationSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 bg-[var(--theme-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6 max-w-lg">
              {data.title || "Do You Have Any Dinner Plan Today? Reserve Your Table"}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-lg">
              {data.subtitle || "Make online reservations, read restaurant reviews from diners, and earn points towards free meals. OpenTable is a real-time online reservation network."}
            </p>
            <button className="px-8 py-3.5 bg-[var(--theme-primary)] text-gray-900 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center">
              {data.buttonText || "Make Reservation"}
            </button>
          </div>
          
          <div className="flex-1 relative flex justify-center items-center">
             <div className="absolute inset-0 bg-orange-100 opacity-50 rounded-full blur-3xl transform translate-x-12"></div>
             <img 
               src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="Restaurant ambiance" 
               className="relative rounded-full w-80 h-80 object-cover shadow-2xl border-8 border-white"
             />
          </div>
        </div>
      </div>
    </section>
  );
}
