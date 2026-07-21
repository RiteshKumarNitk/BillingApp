import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer({ data, config, tenant }: { data: FooterSection['data'], config: WebsiteConfig, tenant: any }) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant?.name || '');
  const socialLinks = config.businessInfo?.socialLinks;
  const siteId = tenant.websiteSlug || tenant.id;

  return (
    <footer className="border-t border-black/10 bg-[var(--theme-background)]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          <div>
            <Link href={`/site/${siteId}`} className="text-lg font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>
              {tenant?.name || 'Cafe'}
            </Link>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs">
              {config.seo?.metaDescription || 'A quiet place for good coffee.'}
            </p>
          </div>

          <div className="space-y-2.5 text-sm text-gray-500">
            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{config.businessInfo?.address || tenant.address || 'Address on request'}</p>
            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{config.businessInfo?.phone || tenant.phone || '—'}</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{config.businessInfo?.email || tenant.email || '—'}</p>
          </div>

          {data.showSocialLinks && socialLinks && (
            <div className="flex gap-4 sm:justify-end text-sm">
              {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--theme-primary)]">Facebook</a>}
              {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--theme-primary)]">Instagram</a>}
            </div>
          )}
        </div>
        <div className="pt-6 border-t border-black/10 text-xs text-gray-400">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
