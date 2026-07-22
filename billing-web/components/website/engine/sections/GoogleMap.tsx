import React from 'react';
import { GoogleMapSection, WebsiteConfig } from '@/lib/website/types';
import { getMapEmbedUrl } from '@/lib/website/directions';

export type GoogleMapStyle = 'rounded' | 'square';

export default function GoogleMap({ data, config, tenant, variant = 'rounded' }: { data: GoogleMapSection['data']; config: WebsiteConfig; tenant: any; variant?: GoogleMapStyle }) {
  const embedUrl = getMapEmbedUrl({
    latitude: tenant?.latitude,
    longitude: tenant?.longitude,
    address: config.businessInfo?.address || tenant?.address,
    name: tenant?.name || 'Cafe',
  });
  const maxWidth = variant === 'square' ? 'max-w-4xl' : 'max-w-6xl';
  const frameClass = variant === 'square' ? 'aspect-video w-full overflow-hidden border border-black/10' : 'aspect-video w-full overflow-hidden rounded-3xl shadow-sm';
  const padding = variant === 'square' ? 'py-24 px-6' : 'py-24 px-4 sm:px-6 lg:px-8';

  return (
    <section className={padding} style={variant === 'rounded' ? { backgroundColor: 'var(--theme-background)' } : undefined}>
      <div className={`${maxWidth} mx-auto`}>
        <div className="text-center mb-10">
          <h2 className={variant === 'square' ? 'text-3xl md:text-4xl font-semibold tracking-tight' : 'text-3xl md:text-5xl font-black'} style={{ color: 'var(--theme-primary)' }}>
            {data.title || 'Find Us'}
          </h2>
          {data.subtitle && <p className="text-gray-500 mt-3">{data.subtitle}</p>}
        </div>
        <div className={frameClass}>
          <iframe src={embedUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location map" />
        </div>
      </div>
    </section>
  );
}
