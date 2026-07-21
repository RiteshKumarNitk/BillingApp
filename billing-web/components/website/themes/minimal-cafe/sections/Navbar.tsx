'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Coffee, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/website/CartContext';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, setShowCart } = useCart();
  const brandName = tenant?.name || 'Cafe';
  const siteId = tenant.websiteSlug || tenant.id;

  const links = [
    { label: 'Home', href: `/site/${siteId}` },
    ...(config.pages?.shop !== false ? [{ label: 'Menu', href: `/site/${siteId}/shop` }] : []),
    ...(config.pages?.about !== false ? [{ label: 'About', href: `/site/${siteId}/about` }] : []),
    ...(config.pages?.contact !== false ? [{ label: 'Contact', href: `/site/${siteId}/contact` }] : []),
  ];

  const isActive = (href: string) => {
    if (href === `/site/${siteId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-[var(--theme-background)] sticky top-0 z-50 border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${siteId}`} className="flex items-center gap-2.5">
            {tenant.logoUrl ? (
              <img className="h-9 w-auto" src={tenant.logoUrl} alt={brandName} />
            ) : (
              <>
                <Coffee className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>{brandName}</span>
              </>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide uppercase transition-colors ${
                  isActive(link.href) ? 'text-[var(--theme-primary)] font-semibold' : 'text-gray-500 hover:text-[var(--theme-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button onClick={() => setShowCart(true)} className="relative text-gray-500 hover:text-[var(--theme-primary)] transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[var(--theme-primary)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <button onClick={() => setShowCart(true)} className="relative text-gray-500">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[var(--theme-primary)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 text-gray-500">
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[var(--theme-background)] border-t border-black/10">
          <div className="px-6 py-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2.5 text-sm uppercase tracking-wide ${
                  isActive(link.href) ? 'text-[var(--theme-primary)] font-semibold' : 'text-gray-500'
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
