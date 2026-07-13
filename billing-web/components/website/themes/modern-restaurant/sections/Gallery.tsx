import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';
import Image from 'next/image';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  return (
    <section className="py-20 px-4 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{data.title}</h2>
          {data.subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.images.map((img, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-xl group bg-gray-100">
              {/* Fallback styling for external unoptimized images for now */}
              <img 
                src={img.url} 
                alt={img.caption || `Gallery image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
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
