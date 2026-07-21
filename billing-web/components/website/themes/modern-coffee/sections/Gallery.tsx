import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  if (!data.images?.length) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>{data.title}</h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.images.map((img, idx) => (
            <div key={idx} className={`relative overflow-hidden rounded-2xl group bg-gray-100 ${idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
              <img src={img.url} alt={img.caption || `Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
