import React from 'react';
import { FooterSection, WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { MapPin, Phone, Mail, Leaf } from 'lucide-react';

export default function Footer({ data, config, tenant }: { data: FooterSection['data'], config: WebsiteConfig, tenant: any }) {
  const year = new Date().getFullYear();
  const copyrightText = data.copyrightText.replace('{year}', year.toString()).replace('{tenant}', tenant.name);
  const socialLinks = config.businessInfo?.socialLinks;

  return (
    <footer className="bg-green-950 text-green-300/80" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/site/${tenant.id}`} className="flex items-center gap-3 mb-5">
              <Leaf className="w-6 h-6 text-green-400" />
              <span className="font-bold text-lg text-white tracking-tight">{tenant.name}</span>
            </Link>
            <p className="text-sm text-green-400/60 leading-relaxed mb-6 max-w-xs">
              {tenant.aboutText || "Bringing farm-fresh produce straight to your doorstep. Naturally grown, ethically sourced."}
            </p>
            {data.showSocialLinks && (
              <div className="flex gap-3">
                {[
                  { href: socialLinks?.facebook || '#', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                  { href: socialLinks?.instagram || '#', icon: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' },
                  { href: socialLinks?.twitter || '#', icon: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-green-800/50 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={s.icon}/></svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: `/site/${tenant.id}` },
                { label: 'Shop', href: `/menu/${tenant.id}/shop` },
                { label: 'About', href: `/site/${tenant.id}/about` },
                { label: 'Contact', href: `/site/${tenant.id}/contact` },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-green-400/60 hover:text-green-300 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Services</h4>
            <ul className="space-y-3 text-sm text-green-400/60">
              {['Home Delivery', 'Weekly Subscription', 'Bulk Orders', 'Corporate Gifting'].map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Contact Us</h4>
            <ul className="space-y-4 text-sm text-green-400/60">
              {[
                { icon: MapPin, text: tenant.address || config.businessInfo?.address || "123 Farm Road, Green Valley" },
                { icon: Phone, text: tenant.phone || config.businessInfo?.phone || "+91 98765 43210" },
                { icon: Mail, text: tenant.email || config.businessInfo?.email || "hello@freshharvest.com" },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <item.icon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-green-500">
          <p>{copyrightText}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-green-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-green-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
