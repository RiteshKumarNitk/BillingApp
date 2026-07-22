import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export type GalleryStyle = 'featured' | 'caption' | 'simple';

export default function Gallery({ data, variant = 'featured' }: { data: GallerySection['data']; config: WebsiteConfig; variant?: GalleryStyle }) {
  if (!data.images?.length) return null;

  if (variant === 'simple') {
    return (
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>{data.title}</h2>
            {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden bg-gray-100">
                <img src={img.url} alt={img.caption || `Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'caption') {
    return (
      <section className="py-20 px-4 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{data.title}</h2>
            {data.subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{data.subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-xl group bg-gray-100">
                <img src={img.url} alt={img.caption || `Gallery image ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                {img.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <p className="text-white p-4 font-medium">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 'featured' — first tile spans 2x2 (modern-coffee's original look)
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
