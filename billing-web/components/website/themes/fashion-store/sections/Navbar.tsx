'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useCart } from '@/components/website/CartContext';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, setShowCart } = useCart();
  const siteId = tenant.websiteSlug || tenant.id;

  const links = [
    { label: 'Home', href: `/site/${siteId}` },
    ...(config.pages?.shop !== false ? [{ label: 'Shop', href: `/site/${siteId}/shop` }] : []),
    ...(config.pages?.about !== false ? [{ label: 'About', href: `/site/${siteId}/about` }] : []),
    ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${siteId}/contact` }] : []),
  ];

  const isActive = (href: string) => {
    if (href === `/site/${siteId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex md:hidden items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-900">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <Link href={`/site/${siteId}`} className="flex items-center gap-2 flex-1 md:flex-none justify-center md:justify-start">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 object-contain" />
            ) : (
              <span className="font-serif text-xl font-bold tracking-widest text-gray-900 uppercase">{tenant.name}</span>
            )}
          </Link>

          <div className="hidden md:flex flex-1 justify-center items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium tracking-wide rounded-full transition-all ${
                  isActive(link.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 uppercase hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:block p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="hidden sm:block p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <User className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCart(true)} className="p-2 text-gray-900 relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gray-900 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
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
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
