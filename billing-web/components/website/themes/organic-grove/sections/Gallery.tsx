import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  const defaultImages = [
    { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Organic Farm' },
    { url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Fresh Harvest' },
    { url: 'https://images.unsplash.com/photo-1570197785657-d9fe0bcc0f47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Natural Products' },
    { url: 'https://images.unsplash.com/photo-1590779033100-9f8a05c0136f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Pure Ingredients' },
  ];

  const images = data.images?.length ? data.images : defaultImages;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--theme-primary)] font-semibold text-sm uppercase tracking-widest">Our World</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight mt-3 mb-4">
            {data.title || "From Our Fields To Your Table"}
          </h2>
          {data.subtitle && <p className="text-stone-500 max-w-xl mx-auto">{data.subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="relative overflow-hidden rounded-2xl aspect-square group cursor-pointer">
              <img
                src={img.url}
                alt={img.caption || `Gallery ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <p className="text-white font-semibold font-serif text-lg">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
