import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail, UtensilsCrossed } from 'lucide-react';

export default function Footer({ data, config, tenant }: { data: FooterSection['data'], config: WebsiteConfig, tenant: any }) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant.name);
  const socialLinks = config.businessInfo?.socialLinks;
  const siteId = tenant.websiteSlug || tenant.id;

  return (
    <footer className="bg-gray-900 text-gray-300" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/site/${siteId}`} className="flex items-center gap-3 mb-5">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="h-9 object-contain brightness-0 invert" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-lg text-white tracking-tight">{tenant.name}</span>
                </>
              )}
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              {tenant.aboutText || "Bringing you the best culinary experience with fresh ingredients and master chefs."}
            </p>
            {data.showSocialLinks && (
              <div className="flex gap-3">
                <a href={socialLinks?.facebook || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-gray-900 transition-all text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href={socialLinks?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-gray-900 transition-all text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href={socialLinks?.twitter || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-gray-900 transition-all text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: `/site/${siteId}` },
                ...(config.pages?.about !== false ? [{ label: 'About Us', href: `/site/${(tenant.websiteSlug || tenant.id)}/about` }] : []),
                ...(config.pages?.shop !== false ? [{ label: 'Menu', href: `/site/${siteId}/shop` }] : []),
                ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${(tenant.websiteSlug || tenant.id)}/contact` }] : []),
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Services</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {['Online Order', 'Table Reservation', 'Catering', 'Home Delivery'].map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Get In Touch</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {[
                { icon: MapPin, text: tenant.address || "123 Restaurant Street, City" },
                { icon: Phone, text: tenant.phone || "+1 234 567 8900" },
                { icon: Mail, text: tenant.email || "hello@restaurant.com" },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <item.icon className="w-4 h-4 text-[var(--theme-primary)] flex-shrink-0 mt-0.5" />
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
