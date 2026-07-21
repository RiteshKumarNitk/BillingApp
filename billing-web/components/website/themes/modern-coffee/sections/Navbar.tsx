'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Coffee, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/website/CartContext';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, setShowCart } = useCart();
  const brandName = tenant?.name || 'Coffee House';
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
    <nav className="w-full bg-[var(--theme-background)]/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${siteId}`} className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img className="h-10 w-auto" src={tenant.logoUrl} alt={brandName} />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--theme-primary)' }}>
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>{brandName}</span>
              </>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${
                  isActive(link.href) ? 'text-white' : 'text-[var(--theme-primary)] hover:bg-black/5'
                }`}
                style={isActive(link.href) ? { backgroundColor: 'var(--theme-primary)' } : undefined}
              >
                {link.label}
              </Link>
            ))}
            <button onClick={() => setShowCart(true)} className="relative ml-2 p-2.5 rounded-full text-white" style={{ backgroundColor: 'var(--theme-primary)' }}>
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--theme-accent)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setShowCart(true)} className="relative p-2 rounded-full text-white" style={{ backgroundColor: 'var(--theme-primary)' }}>
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--theme-accent)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2" style={{ color: 'var(--theme-primary)' }}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[var(--theme-background)] border-t border-black/10 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm font-bold rounded-xl"
                style={{ color: 'var(--theme-primary)' }}
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
