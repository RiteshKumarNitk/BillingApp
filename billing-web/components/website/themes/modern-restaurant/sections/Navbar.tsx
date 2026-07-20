'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChefHat, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/website/CartContext';

export default function Navbar({ tenant, config }: { tenant: any, config: WebsiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, setShowCart } = useCart();
  const brandName = tenant?.name || 'Restaurant';
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
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${siteId}`} className="flex items-center gap-3 group">
            {tenant.logoUrl ? (
              <img className="h-10 w-auto" src={tenant.logoUrl} alt={brandName} />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <span className="text-xl font-bold text-gray-900" style={{ color: 'var(--theme-primary)' }}>{brandName}</span>
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
            <div className="flex items-center gap-3 ml-3">
              <button onClick={() => setShowCart(true)} className="p-2 text-gray-600 hover:text-[var(--theme-primary)] transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[var(--theme-primary)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              {config.pages?.shop !== false && (
                <Link
                  href={`/site/${siteId}/shop`}
                  className="px-5 py-2.5 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:opacity-90 transition-all text-sm shadow-sm"
                >
                  Order Online
                </Link>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            {config.pages?.shop !== false && (
              <Link
                href={`/site/${siteId}/shop`}
                className="mr-2 px-4 py-2 bg-[var(--theme-primary)] text-white text-sm font-semibold rounded-full"
              >
                Order
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-500 hover:text-gray-700">
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
          </div>
        </div>
      )}
    </nav>
  );
}
