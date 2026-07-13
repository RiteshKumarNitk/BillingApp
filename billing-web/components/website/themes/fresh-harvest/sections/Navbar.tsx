'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Leaf, Menu, X } from 'lucide-react';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const siteId = tenant.websiteSlug || tenant.id;

  const links = [
    { label: 'Home', href: `/site/${siteId}` },
    { label: 'Shop', href: `/menu/${siteId}/shop` },
    { label: 'About', href: `/site/${siteId}/about` },
    { label: 'Contact', href: `/site/${siteId}/contact` },
  ];

  const isActive = (href: string) => {
    if (href === `/site/${siteId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${siteId}`} className="flex items-center gap-3 group">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-10 object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-sm group-hover:shadow group-hover:scale-105 transition-all">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-green-900 tracking-tight">{tenant.name}</span>
              </>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                  isActive(link.href)
                    ? 'bg-green-100 text-green-700'
                    : 'text-green-700/70 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/menu/${siteId}/shop`}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:shadow-md hover:scale-105 transition-all text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Shop Now
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-green-700 hover:text-green-500">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-green-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive(link.href)
                    ? 'bg-green-100 text-green-700'
                    : 'text-green-700/70 hover:bg-green-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href={`/menu/${siteId}/shop`} onClick={() => setIsOpen(false)}
              className="block mt-3 px-4 py-2.5 text-sm font-bold text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl">
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
