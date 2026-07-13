import React from 'react';
import { AppDownloadSection, WebsiteConfig } from '@/lib/website/types';

export default function AppDownload({ data, config }: { data: AppDownloadSection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--theme-background)] rounded-[40px] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex-1 z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6 max-w-md">
              {data.title || "Never Feel Hungry! Download Our Mobile App"}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-lg">
              {data.subtitle || "Make online reservations, read restaurant reviews from diners, and earn points towards free meals. OpenTable is a real-time online reservation network."}
            </p>
            
            <div className="flex gap-4">
              <a href={data.appStoreUrl || "#"} className="bg-gray-900 text-white rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors shadow-lg">
                {/* Mock Apple Icon */}
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.14.07 2.22.51 2.97 1.25-2.45 1.54-2.06 4.8.46 5.86-.71 2.05-1.99 4.31-3.01 5.86zm-3.03-14.4c.59-1.25.68-2.67.14-3.88-1.15.22-2.58.94-3.28 2.08-.55 1.08-.82 2.35-.12 3.65 1.27.05 2.58-.72 3.26-1.85z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] opacity-80 uppercase tracking-wider">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a href={data.playStoreUrl || "#"} className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-sm">
                {/* Mock Play Icon */}
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-green-500"><path d="M5.4 3.1l11.4 10.3c.4.3.4.9 0 1.2L5.4 24.9c-.6.5-1.4.1-1.4-.7V3.8c0-.8.8-1.2 1.4-.7z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] opacity-80 uppercase tracking-wider text-gray-500">Get it on</div>
                  <div className="text-sm font-bold text-gray-900">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="flex-1 relative z-10 flex justify-center">
            {/* Mock iPhone frame */}
            <div className="w-[280px] h-[550px] bg-white rounded-[40px] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden transform rotate-6 hover:rotate-0 transition-transform duration-500">
               {/* Notch */}
               <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl w-32 mx-auto z-20"></div>
               <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="App screen" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex flex-col justify-end p-6">
                 <div className="text-white font-bold text-2xl mb-1">Delicious Food</div>
                 <div className="text-white/80 text-sm">Right at your fingertips</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
