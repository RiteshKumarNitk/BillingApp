import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  const images = data.images || [];
  if (!images.length) return null;

  return (
    <section className="py-20 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">Gallery</span>
          <h2 className="text-4xl font-extrabold text-green-900 tracking-tight mt-2 mb-4">
            {data.title || "Our Fresh Collection"}
          </h2>
          {data.subtitle && <p className="text-green-700/60 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.slice(0, 6).map((img, idx) => (
            <div key={idx} className={`relative overflow-hidden rounded-2xl group cursor-pointer ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
              <div className={`${idx === 0 ? 'aspect-square md:aspect-auto md:h-full' : 'aspect-square'}`}>
                <img
                  src={img.url}
                  alt={img.caption || `Gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <p className="text-white font-semibold text-lg">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
