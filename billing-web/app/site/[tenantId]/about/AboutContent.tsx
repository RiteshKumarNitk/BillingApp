'use client';

import { WebsiteConfig } from '@/lib/website/types';

export default function AboutContent({ config, tenant }: { config: WebsiteConfig; tenant: any }) {
  const primary = config.appearance?.colors?.primary || '#EAB308';
  const bg = config.appearance?.colors?.background || '#FAF9F5';

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: config.appearance?.colors?.text || '#1F2937' }}>
          About {tenant.name}
        </h1>
        <div className="w-20 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }} />
      </div>

      {/* Our Story */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: primary }}>Our Story</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-lg leading-relaxed opacity-80">
              {tenant.aboutText || `Welcome to ${tenant.name}. We are dedicated to providing the best experience for our customers.`}
            </p>
            <p className="text-lg leading-relaxed opacity-80 mt-4">
              Our journey began with a simple mission: to deliver quality and excellence in everything we do.
              We believe in building lasting relationships with our community through trust, transparency, and outstanding service.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: primary + '15', minHeight: '300px' }} />
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
