import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail, Coffee } from 'lucide-react';

export default function Footer({ data, config, tenant }: { data: FooterSection['data'], config: WebsiteConfig, tenant: any }) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant?.name || '');
  const socialLinks = config.businessInfo?.socialLinks;
  const siteId = tenant.websiteSlug || tenant.id;

  return (
    <footer style={{ backgroundColor: 'var(--theme-primary)' }} className="text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/site/${siteId}`} className="flex items-center gap-3 mb-5">
              {tenant.logoUrl ? (
                <img className="h-9 w-auto brightness-0 invert opacity-90" src={tenant.logoUrl} alt={tenant.name} />
              ) : (
                <>
                  <Coffee className="w-6 h-6 text-white" />
                  <span className="font-bold text-lg text-white">{tenant?.name || 'Coffee House'}</span>
                </>
              )}
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {config.seo?.metaDescription || 'Handcrafted coffee, made with care.'}
            </p>
            {data.showSocialLinks && socialLinks && (
              <div className="flex gap-3 mt-6">
                {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-xs font-bold">FB</a>}
                {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-xs font-bold">IG</a>}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Links</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Home', href: `/site/${siteId}` },
                ...(config.pages?.shop !== false ? [{ label: 'Menu', href: `/site/${siteId}/shop` }] : []),
                ...(config.pages?.about !== false ? [{ label: 'About', href: `/site/${siteId}/about` }] : []),
                ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${siteId}/contact` }] : []),
              ].map(link => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Hours</h4>
            <ul className="space-y-3 text-sm">
              <li>Mon - Fri: 8:00 AM - 9:00 PM</li>
              <li>Sat - Sun: 9:00 AM - 10:00 PM</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Contact</h4>
            <ul className="space-y-4 text-sm">
              {[
                { icon: MapPin, text: config.businessInfo?.address || tenant.address || 'Address on request' },
                { icon: Phone, text: config.businessInfo?.phone || tenant.phone || '—' },
                { icon: Mail, text: config.businessInfo?.email || tenant.email || '—' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-center">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
