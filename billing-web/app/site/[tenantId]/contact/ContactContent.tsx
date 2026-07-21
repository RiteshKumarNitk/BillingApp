'use client';

import { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';

const DAY_LABELS: { key: keyof NonNullable<NonNullable<WebsiteConfig['businessInfo']>['hours']>; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function formatTime(value?: string) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ContactContent({ config, tenant }: { config: WebsiteConfig; tenant: any }) {
  const primary = config.appearance?.colors?.primary || '#EAB308';
  const bg = config.appearance?.colors?.background || '#FAF9F5';
  const structuredHours = config.businessInfo?.hours;
  const hasStructuredHours = structuredHours && Object.values(structuredHours).some(d => d && (d.closed || d.open || d.close));
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId: tenant.id, source: 'website' })
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: config.appearance?.colors?.text || '#1F2937' }}>
          Contact Us
        </h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto">
          We'd love to hear from you. Drop us a message and we'll get back to you as soon as possible.
        </p>
        <div className="w-20 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: primary }} />
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div>
          {submitted ? (
            <div className="p-8 rounded-xl text-center" style={{ backgroundColor: primary + '15' }}>
              <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
              <p className="opacity-70">Your message has been received. We'll get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: primary + '40', backgroundColor: bg }} placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: primary + '40', backgroundColor: bg }} placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: primary + '40', backgroundColor: bg }} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input type="text" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: primary + '40', backgroundColor: bg }} placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3 rounded-lg border" style={{ borderColor: primary + '40', backgroundColor: bg }} placeholder="Your message..." />
              </div>
              <button type="submit" className="w-full py-3 px-6 rounded-lg text-white font-semibold" style={{ backgroundColor: primary }}>
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Contact Details */}
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>Our Location</h3>
            <p className="opacity-70">{tenant.address || tenant.city || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>Phone</h3>
            <p className="opacity-70">{tenant.phone || tenant.mobile || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>Email</h3>
            <p className="opacity-70">{tenant.email || 'N/A'}</p>
          </div>
          {hasStructuredHours ? (
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>Business Hours</h3>
              <dl className="space-y-1.5 text-sm">
                {DAY_LABELS.map(({ key, label }) => {
                  const day = structuredHours?.[key];
                  return (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="opacity-70">{label}</dt>
                      <dd className="font-medium">
                        {day?.closed ? 'Closed' : (day?.open && day?.close) ? `${formatTime(day.open)} – ${formatTime(day.close)}` : '—'}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ) : tenant.businessHours && (
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>Business Hours</h3>
              <p className="opacity-70 whitespace-pre-line">{tenant.businessHours}</p>
            </div>
          )}
          {config.businessInfo?.whatsapp && (
            <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: primary }}>WhatsApp</h3>
              <a
                href={`https://wa.me/${config.businessInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                {config.businessInfo.whatsapp}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
