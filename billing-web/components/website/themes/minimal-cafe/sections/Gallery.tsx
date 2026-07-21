import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  if (!data.images?.length) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>
            {data.title}
          </h2>
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
