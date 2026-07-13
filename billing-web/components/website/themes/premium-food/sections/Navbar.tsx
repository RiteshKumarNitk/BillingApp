'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, UtensilsCrossed } from 'lucide-react';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const primary = config.appearance?.colors?.primary || '#EAB308';

  const links = [
    { label: 'Home', href: `/site/${tenant.id}` },
    { label: 'About', href: `/site/${tenant.id}/about` },
    { label: 'Menu', href: `/menu/${tenant.id}/shop` },
    { label: 'Contact', href: `/site/${tenant.id}/contact` },
  ];

  const isActive = (href: string) => {
    if (href === `/site/${tenant.id}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${tenant.id}`} className="flex items-center gap-3 group">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-10 object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-gray-900 font-extrabold text-xl shadow-sm group-hover:scale-105 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl text-gray-900 tracking-tight">{tenant.name}</span>
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
                    ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                    : 'text-gray-600 hover:text-[var(--theme-primary)] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all relative">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <Link
              href={`/menu/${tenant.id}/shop`}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-primary)] text-gray-900 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              Order Online
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-600 hover:text-[var(--theme-primary)]">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive(link.href)
                    ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href={`/menu/${tenant.id}/shop`} onClick={() => setIsOpen(false)}
              className="block mt-3 px-4 py-2.5 text-sm font-bold text-center bg-[var(--theme-primary)] text-gray-900 rounded-xl">
              Order Online
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
