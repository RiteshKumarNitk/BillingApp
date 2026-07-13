"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart, X, Trash2, Plus, Minus, MapPin, ExternalLink,
  User, Mail, Lock, Phone, LogIn, Store
} from 'lucide-react';
import { getMenuTheme, menuThemeCssVars, MenuTheme } from './menuThemes';
import { CartProvider, useCart } from './CartContext';
import { getDirectionsUrl } from './menuUtils';
import type { MenuTenant } from './data';

interface MenuShellProps {
  tenantId: string;
  tenant: MenuTenant;
  children: React.ReactNode;
}

export default function MenuShell({ tenantId, tenant, children }: MenuShellProps) {
  const theme = getMenuTheme(tenant.menuTheme);

  return (
    <CartProvider tenantId={tenantId}>
      <div
        className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col"
        style={{ ...menuThemeCssVars(theme), fontFamily: theme.id === 'RESTAURANT' ? undefined : 'var(--font-display)' }}
      >
        <SiteNav tenantId={tenantId} tenant={tenant} theme={theme} />
        <div className="flex-1 flex flex-col">{children}</div>
        <OrderSuccessToast theme={theme} />
        <FloatingCartBar theme={theme} />
        <CartDrawer tenant={tenant} theme={theme} />
        <AuthModal theme={theme} />
        <footer className="text-center py-4 text-[9px] text-[var(--muted)] font-semibold opacity-60">Powered by BillingApp</footer>
      </div>
    </CartProvider>
  );
}

function SiteNav({ tenantId, tenant, theme }: { tenantId: string; tenant: MenuTenant; theme: MenuTheme }) {
  const pathname = usePathname();
  const isRestaurant = theme.id === 'RESTAURANT';
  const { cartCount, setShowCart } = useCart();
  const base = `/menu/${tenantId}`;
  const links = [
    { label: 'Home', href: base },
    { label: isRestaurant ? 'Menu' : 'Shop', href: `${base}/shop` },
    { label: 'About', href: `${base}/about` },
    { label: 'Contact', href: `${base}/contact` },
  ];

  return (
    <header className={`sticky top-0 z-30 shadow-sm ${isRestaurant ? 'bg-[var(--surface)] border-b border-[var(--line)]' : 'bg-[var(--primary)] text-[var(--primary-ink)]'}`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <Link href={base} className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 overflow-hidden ${isRestaurant ? 'rounded-full bg-[var(--primary)]' : 'rounded-xl bg-[var(--accent)]'}`}>
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
            ) : isRestaurant ? (
              <span className="text-[15px] font-semibold text-[var(--primary-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {tenant.name.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <Store className="w-4 h-4 text-[var(--accent-ink)]" />
            )}
          </div>
          <span className={`truncate ${isRestaurant ? 'text-base font-semibold' : 'text-sm font-black'}`} style={{ fontFamily: 'var(--font-display)' }}>
            {tenant.name}
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(link => {
            const active = link.href === base ? pathname === base : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  active
                    ? isRestaurant ? 'bg-[var(--bg)] text-[var(--ink)]' : 'bg-white/20 text-[var(--primary-ink)]'
                    : isRestaurant ? 'text-[var(--muted)] hover:text-[var(--ink)]' : 'text-[var(--primary-ink)]/70 hover:text-[var(--primary-ink)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {tenant.phone && (
            <a href={`tel:${tenant.phone}`} className="p-2 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-full transition-colors" aria-label="Call">
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-full transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[var(--accent)] text-[var(--accent-ink)] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function OrderSuccessToast({ theme }: { theme: MenuTheme }) {
  const { orderSuccess } = useCart();
  if (!orderSuccess) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--ink)] text-[var(--bg)] px-6 py-3 rounded-2xl shadow-xl animate-slide-up flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm font-black">Order placed! Store will review.</span>
    </div>
  );
}

function FloatingCartBar({ theme }: { theme: MenuTheme }) {
  const { cartCount, cartTotal, setShowCart } = useCart();
  const isRestaurant = theme.id === 'RESTAURANT';
  if (cartCount === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] ${isRestaurant ? '' : 'bg-[var(--ink)] border-t border-black/20'}`}
      style={isRestaurant ? { background: 'var(--primary)' } : undefined}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${isRestaurant ? 'text-[var(--primary-ink)]' : 'text-[var(--accent)]'}`} />
            <span className="absolute -top-2 -right-2 bg-[var(--accent)] text-[var(--accent-ink)] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
          </div>
          <div>
            <p className={`text-xs font-bold ${isRestaurant ? 'text-[var(--primary-ink)]' : 'text-[var(--bg)]'}`}>{cartCount} item{cartCount > 1 ? 's' : ''}</p>
            <p className={`text-[10px] ${isRestaurant ? 'text-[var(--primary-ink)] opacity-75' : 'text-gray-400'}`}>₹{cartTotal.toFixed(2)}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm ${
            isRestaurant ? 'bg-[var(--primary-ink)] text-[var(--primary)]' : 'bg-[var(--accent)] text-[var(--accent-ink)]'
          }`}>
          View {isRestaurant ? 'Order' : 'Cart'} →
        </button>
      </div>
    </div>
  );
}

function CartDrawer({ tenant, theme }: { tenant: MenuTenant; theme: MenuTheme }) {
  const { cart, showCart, setShowCart, removeFromCart, updateQuantity, cartCount, cartTotal, handlePlaceOrder, submitting, isLoggedIn } = useCart();
  if (!showCart) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCart(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--surface)] text-[var(--ink)] shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>Your Order</h2>
            <span className="bg-[var(--accent)] text-[var(--accent-ink)] text-[10px] font-black px-2 py-0.5 rounded-full">{cartCount}</span>
          </div>
          <button onClick={() => setShowCart(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-[var(--muted)]">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Cart is empty</p>
              <p className="text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.productId}:${item.variantId || ''}`} className="flex items-center gap-3 bg-[var(--bg)] rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">₹{item.salePrice.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-0 bg-[var(--accent)] rounded-xl overflow-hidden">
                    <button onClick={() => item.quantity === 1 ? removeFromCart(item.productId, item.variantId) : updateQuantity(item.productId, -1, item.variantId)}
                      className="w-8 h-8 flex items-center justify-center text-[var(--accent-ink)] hover:brightness-95">
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-black text-[var(--accent-ink)] min-w-[24px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1, item.variantId)} disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center text-[var(--accent-ink)] hover:brightness-95 disabled:opacity-30">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-black min-w-[50px] text-right">₹{(item.salePrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-[var(--line)] p-5 space-y-3 bg-[var(--surface)]">
            <div className="flex justify-between text-xs text-[var(--muted)]"><span>Subtotal</span><span className="font-bold">₹{cartTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-black pt-2 border-t border-[var(--line)]"><span>Total</span><span>₹{cartTotal.toFixed(2)}</span></div>
            {tenant.address && (
              <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] bg-[var(--bg)] rounded-xl px-3 py-2">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                <span className="truncate">{tenant.address}</span>
                <a href={getDirectionsUrl(tenant)} target="_blank" rel="noopener noreferrer" className="font-bold whitespace-nowrap flex items-center gap-0.5">
                  Directions <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            <button onClick={handlePlaceOrder} disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]">
              {submitting ? 'Placing Order...' : isLoggedIn ? `Place Order — ₹${cartTotal.toFixed(2)}` : `Login to Order — ₹${cartTotal.toFixed(2)}`}
            </button>
            <p className="text-[10px] text-center text-[var(--muted)]">Pick up from store. Tax calculated at checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthModal({ theme }: { theme: MenuTheme }) {
  const isRestaurant = theme.id === 'RESTAURANT';
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, authForm, setAuthForm, authError, authLoading, handleAuth } = useCart();
  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowAuthModal(false)} />
      <div className="relative bg-[var(--surface)] text-[var(--ink)] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-1 hover:bg-black/5 rounded-lg">
          <X className="w-5 h-5 text-[var(--muted)]" />
        </button>
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: 'color-mix(in srgb, var(--primary) 18%, transparent)' }}>
            <LogIn className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>{authMode === 'login' ? 'Sign In to Order' : 'Create Account'}</h2>
          <p className="text-xs text-[var(--muted)] mt-1">{authMode === 'login' ? 'Sign in to place your order' : 'Register to start ordering'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-3">
          {authError && (
            <div className={`px-3 py-2 rounded-xl text-xs font-semibold border ${isRestaurant ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {authError}
            </div>
          )}
          {authMode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input type="text" required placeholder="Your name" value={authForm.name} onChange={(e) => setAuthForm(p => ({ ...p, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-[var(--line)] rounded-xl text-sm bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--ink)]" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input type="email" required placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-[var(--line)] rounded-xl text-sm bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--ink)]" />
          </div>
          {authMode === 'register' && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input type="tel" placeholder="Phone (optional)" value={authForm.phone} onChange={(e) => setAuthForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-[var(--line)] rounded-xl text-sm bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--ink)]" />
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input type="password" required minLength={6} placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm(p => ({ ...p, password: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-[var(--line)] rounded-xl text-sm bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--ink)]" />
          </div>
          <button type="submit" disabled={authLoading}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account & Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); }}
            className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]">
            {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
