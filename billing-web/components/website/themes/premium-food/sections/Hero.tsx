import React from 'react';
import { HeroSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { Search, Utensils, Coffee, Pizza, Cookie } from 'lucide-react';

export default function Hero({ data, config, tenant }: { data: HeroSection['data'], config: WebsiteConfig, tenant: any }) {
  const coverImage = tenant?.coverImageUrl || data.backgroundImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  return (
    <section className="relative w-full min-h-[85vh] flex items-center pt-20 pb-16 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-500 opacity-5 rounded-full blur-3xl"></div>
      
      {/* Little dot matrix decorations (SVG data URI) */}
      <div className="absolute top-32 left-8 w-16 h-16 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
      <div className="absolute bottom-1/4 right-8 w-24 h-24 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Content */}
        <div className="flex-1 text-center md:text-left mt-10 md:mt-0">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            {data.title || "We Serve The Taste You Love"} <span className="inline-block text-3xl md:text-5xl">😋</span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto md:mx-0 leading-relaxed">
            {data.subtitle || "This is a type of restaurant which typically serves food and drinks, in addition to light refreshments such as baked goods or snacks."}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <Link 
              href={data.ctaPrimary?.url || "#menu"}
              className="px-8 py-3.5 bg-[var(--theme-primary)] text-gray-900 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
            >
              {data.ctaPrimary?.label || "Explore Food"}
            </Link>
            
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-12 pr-6 py-3.5 border-2 border-gray-200 rounded-full w-full sm:w-48 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-all bg-white/50 backdrop-blur-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Right Content (Image with badges) */}
        <div className="flex-1 relative flex justify-center items-center h-[400px] md:h-[600px] w-full">
          {/* Main Circular Plate background layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/10 to-transparent rounded-full transform rotate-12 scale-90 -z-10 blur-xl"></div>
          <div className="absolute w-[80%] h-[80%] rounded-full border border-[var(--theme-primary)]/20 scale-110"></div>
          
          {/* Main Image */}
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full p-2 bg-white shadow-2xl z-10">
            <img 
              src={coverImage}
              alt="Delicious food"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Floating Badges */}
          <div className="absolute top-[10%] right-[5%] bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-bounce hover:scale-110 transition-transform cursor-pointer z-20" style={{ animationDuration: '3s' }}>
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-800">Dishes</span>
          </div>

          <div className="absolute bottom-[20%] right-0 bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-bounce hover:scale-110 transition-transform cursor-pointer z-20" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <Cookie className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-800">Dessert</span>
          </div>

          <div className="absolute bottom-[10%] left-[10%] bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-bounce hover:scale-110 transition-transform cursor-pointer z-20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
              <Pizza className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-800">Snacks</span>
          </div>

          <div className="absolute top-[20%] left-0 bg-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-bounce hover:scale-110 transition-transform cursor-pointer z-20" style={{ animationDuration: '3.2s', animationDelay: '0.2s' }}>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-800">Drinks</span>
          </div>

        </div>

      </div>
    </section>
  );
}
