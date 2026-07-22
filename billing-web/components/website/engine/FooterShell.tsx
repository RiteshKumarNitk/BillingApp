import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail, Coffee } from 'lucide-react';

export type FooterStyle = 'primary' | 'minimal' | 'dark';

interface FooterShellProps {
  data: FooterSection['data'];
  config: WebsiteConfig;
  tenant: any;
  variant?: FooterStyle;
}

// The ~60-65% of every theme's old Footer.tsx that was identical (copyright interpolation, social
// links, Links/Contact column plumbing) lives here once. `variant` covers the real structural
// fork: minimal-cafe's plain light 3-column footer vs. modern-coffee's theme-colored 4-column
// footer vs. modern-restaurant/premium-food's fixed-dark 4-column footer with a Privacy/Terms row.
export default function FooterShell({ data, config, tenant, variant = 'primary' }: FooterShellProps) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant?.name || '');
  const socialLinks = config.businessInfo?.socialLinks;
  const siteId = tenant.websiteSlug || tenant.id;

  const links = [
    { label: 'Home', href: `/site/${siteId}` },
    ...(config.pages?.shop !== false ? [{ label: 'Menu', href: `/site/${siteId}/shop` }] : []),
    ...(config.pages?.about !== false ? [{ label: 'About', href: `/site/${siteId}/about` }] : []),
    ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${siteId}/contact` }] : []),
  ];

  const contactItems = [
    { icon: MapPin, text: config.businessInfo?.address || tenant.address || 'Address on request' },
    { icon: Phone, text: config.businessInfo?.phone || tenant.phone || '—' },
    { icon: Mail, text: config.businessInfo?.email || tenant.email || '—' },
  ];

  if (variant === 'minimal') {
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
              {contactItems.map((item, i) => (
                <p key={i} className="flex items-center gap-2"><item.icon className="w-3.5 h-3.5 flex-shrink-0" />{item.text}</p>
              ))}
            </div>
            {data.showSocialLinks && socialLinks && (
              <div className="flex gap-4 sm:justify-end text-sm">
                {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--theme-primary)]">Facebook</a>}
                {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[var(--theme-primary)]">Instagram</a>}
              </div>
            )}
          </div>
          <div className="pt-6 border-t border-black/10 text-xs text-gray-400">{copyrightText}</div>
        </div>
      </footer>
    );
  }

  if (variant === 'dark') {
    return (
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href={`/site/${siteId}`} className="flex items-center gap-3 mb-5">
                {tenant.logoUrl ? (
                  <img className="h-9 w-auto brightness-0 invert opacity-80" src={tenant.logoUrl} alt={tenant.name} />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-primary)' }}>
                      <Coffee className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white">{tenant?.name || 'Restaurant'}</span>
                  </>
                )}
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
                {config.seo?.metaDescription || tenant?.aboutText || 'Bringing you the best culinary experience with fresh ingredients and master chefs.'}
              </p>
              {data.showSocialLinks && socialLinks && (
                <div className="flex gap-3">
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">FB</a>}
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">IG</a>}
                  {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">X</a>}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Links</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}><Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Hours</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>Mon - Fri: 9:00 AM - 10:00 PM</li>
                <li>Sat - Sun: 10:00 AM - 11:00 PM</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Contact</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                {contactItems.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <item.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>{copyrightText}</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // 'primary' — theme-colored background (modern-coffee's original look)
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
            <p className="text-sm leading-relaxed max-w-xs">{config.seo?.metaDescription || 'Handcrafted, made with care.'}</p>
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
              {links.map((link) => (
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
              {contactItems.map((item, i) => (
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-center">{copyrightText}</div>
      </div>
    </footer>
  );
}
