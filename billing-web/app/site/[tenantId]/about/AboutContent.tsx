'use client';

import { WebsiteConfig } from '@/lib/website/types';
import { pickHeroImage } from '@/lib/cafes/heroImage';

export default function AboutContent({ config, tenant }: { config: WebsiteConfig; tenant: any }) {
  const primary = config.appearance?.colors?.primary || '#EAB308';
  const bg = config.appearance?.colors?.background || '#FAF9F5';
  const galleryFirst = (config.sections?.find((s: any) => s.type === 'gallery') as any)?.data?.images?.[0]?.url ?? null;
  const storyImage = pickHeroImage({
    coverImageUrl: tenant.coverImageUrl,
    shopFrontImageUrl: tenant.shopFrontImageUrl,
    galleryFirstImageUrl: galleryFirst,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: config.appearance?.colors?.text || '#1F2937' }}>
          About {tenant.name}
        </h1>
        <div className="w-20 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }} />
      </div>

      {tenant.tagline && (
        <p className="text-center text-lg opacity-70 -mt-10 mb-16">{tenant.tagline}</p>
      )}

      {/* Our Story */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: primary }}>Our Story</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-lg leading-relaxed opacity-80 whitespace-pre-line">
              {tenant.aboutText || `Welcome to ${tenant.name}. We are dedicated to providing the best experience for our customers.`}
            </p>
          </div>
          {storyImage ? (
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ minHeight: '300px' }}>
              <img src={storyImage} alt={tenant.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: primary + '15', minHeight: '300px' }} />
          )}
        </div>
      </section>

      {/* Contact Info */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: primary }}>Get In Touch</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl shadow-sm border" style={{ borderColor: primary + '30', backgroundColor: bg }}>
            <h3 className="font-semibold mb-2">Address</h3>
            <p className="opacity-70">{tenant.address || tenant.city || 'N/A'}</p>
          </div>
          <div className="p-6 rounded-xl shadow-sm border" style={{ borderColor: primary + '30', backgroundColor: bg }}>
            <h3 className="font-semibold mb-2">Phone</h3>
            <p className="opacity-70">{tenant.phone || tenant.mobile || 'N/A'}</p>
          </div>
          <div className="p-6 rounded-xl shadow-sm border" style={{ borderColor: primary + '30', backgroundColor: bg }}>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="opacity-70">{tenant.email || 'N/A'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
