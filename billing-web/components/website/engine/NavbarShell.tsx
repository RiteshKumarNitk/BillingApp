'use client';
import React, { useState } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Coffee, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/website/CartContext';

export type NavStyle = 'minimal' | 'pill' | 'cta';

interface NavbarShellProps {
  tenant: any;
  config: WebsiteConfig;
  variant?: NavStyle;
}

// The ~70% of every theme's old Navbar.tsx that was byte-for-byte identical (link construction
// from config.pages, isActive(), mobile-menu state, cart-badge wiring via useCart()) lives here
// once. `variant` covers the real structural fork found across the 4 themes: minimal-cafe's plain
// text links, modern-coffee's rounded active-pill + circular cart button, and modern-restaurant/
// premium-food's active-pill + explicit "Order Online" CTA.
export default function NavbarShell({ tenant, config, variant = 'pill' }: NavbarShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, setShowCart } = useCart();
  const brandName = tenant?.name || 'Cafe';
  const siteId = tenant.websiteSlug || tenant.id;
  const LogoIcon = variant === 'cta' ? UtensilsCrossed : Coffee;

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

  const CartButton = ({ small = false }: { small?: boolean }) => {
    if (variant === 'minimal') {
      return (
        <button onClick={() => setShowCart(true)} className="relative text-gray-500 hover:text-[var(--theme-primary)] transition-colors">
          <ShoppingCart className={small ? 'w-5 h-5' : 'w-5 h-5'} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[var(--theme-primary)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
          )}
        </button>
      );
    }
    if (variant === 'cta') {
      return (
        <button onClick={() => setShowCart(true)} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all relative">
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">{cartCount}</span>
          )}
        </button>
      );
    }
    return (
      <button onClick={() => setShowCart(true)} className={`relative ${small ? 'p-2' : 'ml-2 p-2.5'} rounded-full text-white`} style={{ backgroundColor: 'var(--theme-primary)' }}>
        <ShoppingCart className="w-4 h-4" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[var(--theme-accent)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
        )}
      </button>
    );
  };

  const linkClass = (href: string) => {
    if (variant === 'minimal') {
      return `text-sm tracking-wide uppercase transition-colors ${isActive(href) ? 'text-[var(--theme-primary)] font-semibold' : 'text-gray-500 hover:text-[var(--theme-primary)]'}`;
    }
    return `px-4 py-2 text-sm font-bold rounded-full transition-all ${
      isActive(href) ? (variant === 'pill' ? 'text-white' : 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]') : 'text-[var(--theme-primary)] hover:bg-black/5'
    }`;
  };

  return (
    <nav className={`w-full sticky top-0 z-50 ${variant === 'minimal' ? 'bg-[var(--theme-background)] border-b border-black/10' : 'bg-[var(--theme-background)]/95 backdrop-blur-md shadow-sm'}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${variant === 'minimal' ? 'max-w-6xl' : 'max-w-7xl'}`}>
        <div className="flex items-center justify-between h-20">
          <Link href={`/site/${siteId}`} className="flex items-center gap-2.5">
            {tenant.logoUrl ? (
              <img className="h-9 w-auto" src={tenant.logoUrl} alt={brandName} />
            ) : variant === 'minimal' ? (
              <>
                <LogoIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--theme-primary)' }}>{brandName}</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: variant === 'cta' ? 'var(--theme-primary)' : 'var(--theme-primary)' }}>
                  <LogoIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--theme-primary)' }}>{brandName}</span>
              </>
            )}
          </Link>

          <div className={`hidden md:flex items-center ${variant === 'minimal' ? 'gap-8' : 'gap-1'}`}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)} style={variant === 'pill' && isActive(link.href) ? { backgroundColor: 'var(--theme-primary)' } : undefined}>
                {link.label}
              </Link>
            ))}
            {variant !== 'cta' && <CartButton />}
            {variant === 'cta' && (
              <div className="flex items-center gap-3 ml-3">
                <CartButton />
                {config.pages?.shop !== false && (
                  <Link href={`/site/${siteId}/shop`} className="px-5 py-2.5 bg-[var(--theme-primary)] text-white font-semibold rounded-full hover:opacity-90 transition-all text-sm shadow-sm">
                    Order Online
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <CartButton small />
            <button onClick={() => setIsOpen(!isOpen)} className="p-2" style={{ color: variant === 'minimal' ? '#6b7280' : 'var(--theme-primary)' }}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[var(--theme-background)] border-t border-black/10 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm font-bold rounded-xl" style={{ color: 'var(--theme-primary)' }}>
                {link.label}
              </Link>
            ))}
            {variant === 'cta' && config.pages?.shop !== false && (
              <Link href={`/site/${siteId}/shop`} onClick={() => setIsOpen(false)} className="block mt-3 px-4 py-2.5 text-sm font-bold text-center bg-[var(--theme-primary)] text-white rounded-xl">
                Order Online
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
