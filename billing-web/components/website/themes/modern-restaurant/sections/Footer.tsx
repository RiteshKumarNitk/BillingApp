import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail, ChefHat } from 'lucide-react';

export default function Footer({ data, config, tenant }: { data: FooterSection['data'], config: WebsiteConfig, tenant: any }) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant?.name || '');
  const socialLinks = config.businessInfo?.socialLinks;
  const siteId = tenant.websiteSlug || tenant.id;

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
                  <div className="w-9 h-9 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center">
                    <ChefHat className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <span className="font-bold text-lg text-white" style={{ color: 'var(--theme-primary)' }}>{tenant?.name || 'Restaurant'}</span>
                </>
              )}
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              {config.seo?.metaDescription || 'Experience the best dining in town. Fresh ingredients, masterful cooking.'}
            </p>
            {data.showSocialLinks && socialLinks && (
              <div className="flex gap-3">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">FB</a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">IG</a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-white transition-all text-gray-400 text-xs font-bold">X</a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: `/site/${siteId}` },
                ...(config.pages?.shop !== false ? [{ label: 'Menu', href: `/site/${siteId}/shop` }] : []),
                ...(config.pages?.about !== false ? [{ label: 'About Us', href: `/site/${(tenant.websiteSlug || tenant.id)}/about` }] : []),
                ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${(tenant.websiteSlug || tenant.id)}/contact` }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                </li>
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
              {[
                { icon: MapPin, text: config.businessInfo?.address || tenant.address || '123 Main St, City' },
                { icon: Phone, text: config.businessInfo?.phone || tenant.phone || '+1 234 567 8900' },
                { icon: Mail, text: config.businessInfo?.email || tenant.email || 'hello@restaurant.com' },
              ].map((item, i) => (
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
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
