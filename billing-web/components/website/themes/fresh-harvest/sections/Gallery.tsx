import React from 'react';
import { GallerySection, WebsiteConfig } from '@/lib/website/types';

export default function Gallery({ data, config }: { data: GallerySection['data'], config: WebsiteConfig }) {
  const defaultImages = [
    { url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Fresh Fruits' },
    { url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Leafy Greens' },
    { url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Farm Fresh' },
    { url: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Root Vegetables' },
    { url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Organic Produce' },
    { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', caption: 'Fresh Herbs' },
  ];

  const images = data.images?.length ? data.images : defaultImages;

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
