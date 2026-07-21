import React from 'react';
import { GoogleMapSection, WebsiteConfig } from '@/lib/website/types';
import { getMapEmbedUrl } from '@/lib/website/directions';

export default function GoogleMap({ data, config, tenant }: { data: GoogleMapSection['data'], config: WebsiteConfig, tenant: any }) {
  const embedUrl = getMapEmbedUrl({
    latitude: tenant?.latitude,
    longitude: tenant?.longitude,
    address: config.businessInfo?.address || tenant?.address,
    name: tenant?.name || 'Cafe',
  });

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'Find Us'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className="aspect-video w-full overflow-hidden border border-black/10">
          <iframe src={embedUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location map" />
        </div>
      </div>
    </section>
  );
}
