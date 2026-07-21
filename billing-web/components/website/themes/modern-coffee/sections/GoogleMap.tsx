import React from 'react';
import { GoogleMapSection, WebsiteConfig } from '@/lib/website/types';
import { getMapEmbedUrl } from '@/lib/website/directions';

export default function GoogleMap({ data, config, tenant }: { data: GoogleMapSection['data'], config: WebsiteConfig, tenant: any }) {
  const embedUrl = getMapEmbedUrl({
    latitude: tenant?.latitude,
    longitude: tenant?.longitude,
    address: config.businessInfo?.address || tenant?.address,
    name: tenant?.name || 'Coffee House',
  });

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black" style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'Find Us'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-3xl shadow-sm">
          <iframe src={embedUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location map" />
        </div>
      </div>
    </section>
  );
}
