"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { signIn } from 'next-auth/react';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  salePrice: number;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  cart: CartItem[];
  addToCart: (product: any, variant?: any) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, delta: number, variantId?: string) => void;
  getCartQty: (productId: string, variantId?: string) => number;
  cartTotal: number;
  cartCount: number;

  showCart: boolean;
  setShowCart: (v: boolean) => void;

  isLoggedIn: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authMode: 'login' | 'register' | 'guest';
  setAuthMode: (v: 'login' | 'register' | 'guest') => void;
  authForm: { name: string; email: string; phone: string; password: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; password: string }>>;
  authError: string;
  authLoading: boolean;
  handleAuth: (e: React.FormEvent) => Promise<void>;

  // Guest checkout: name + phone only, no account created. Remembered for the rest of this visit
  // (CartProvider persists across client-side nav) so a guest isn't asked twice in one session.
  guestInfo: { name: string; phone: string } | null;
  guestForm: { name: string; phone: string };
  setGuestForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  handleGuestCheckout: (e: React.FormEvent) => Promise<void>;

  submitting: boolean;
  orderSuccess: boolean;
  handlePlaceOrder: () => Promise<void>;

  // QR table ordering: set once from a `?t=<token>` on the URL the customer landed on (e.g. from
  // scanning a table's QR code), then carried in state through client-side navigation and into
  // checkout. tableLabel is resolved async purely for display ("Ordering for Table 5").
  tableToken: string | null;
  tableLabel: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// Owns cart + customer-auth + checkout state for the whole tenant site (Home/Shop/About/Contact).
// Mounted once in app/site/[tenantId]/layout.tsx so it wraps every page, so the cart survives
// client-side navigation between pages instead of resetting per-page.
export function CartProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'guest'>('guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const [guestForm, setGuestForm] = useState({ name: '', phone: '' });
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [tableLabel, setTableLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customer/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user?.id) {
          setIsLoggedIn(true);
          setAuthForm(prev => ({ ...prev, name: data.user.name || '', email: data.user.email || '' }));
        }
      })
      .catch(() => {});
  }, []);

  // Captured once on first mount (this Provider persists across client-side nav within the site,
  // so a `?t=` present only on the page the customer landed on is still available later). Falls
  // back to sessionStorage so a mid-visit reload doesn't silently drop the table context.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('t');
    const token = fromUrl || sessionStorage.getItem(`table_token_${tenantId}`);
    if (!token) return;

    sessionStorage.setItem(`table_token_${tenantId}`, token);
    setTableToken(token);

    fetch(`/api/website/table?tenantId=${tenantId}&token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => { if (data.label) setTableLabel(data.label); })
      .catch(() => {});
  }, [tenantId]);

  const addToCart = useCallback((product: any, variant?: any) => {
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    const price = variant ? variant.salePrice : product.salePrice;
    // SERVICE/COMBO products never carry a meaningful stock number (COMBO's own Product.stock is
    // always 0 — there's no admin UI to set it), so their quantity stepper must never be capped
    // by it the way a stocked item's is.
    const stock = (product.productType === 'SERVICE' || product.productType === 'COMBO')
      ? Infinity
      : (variant ? variant.stock : product.stock);
    setCart(prev => {
      const existing = prev.find(i =>
        variant ? (i.productId === product.id && i.variantId === variant.id) : i.productId === product.id
      );
      if (existing) {
        if (existing.quantity >= stock) return prev;
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, variantId: variant?.id, name, salePrice: price, quantity: 1, stock }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart(prev => prev.filter(i =>
      variantId ? !(i.productId === productId && i.variantId === variantId) : i.productId !== productId
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number, variantId?: string) => {
    setCart(prev => prev.map(i => {
      const matches = variantId
        ? i.productId === productId && i.variantId === variantId
        : i.productId === productId;
      if (!matches) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.stock) return i;
      return { ...i, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  }, []);

  const getCartQty = useCallback((productId: string, variantId?: string) => {
    const item = cart.find(i =>
      variantId ? (i.productId === productId && i.variantId === variantId) : i.productId === productId
    );
    return item?.quantity || 0;
  }, [cart]);

  const cartTotal = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'register') {
        const res = await fetch('/api/customer/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm),
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || 'Registration failed'); setAuthLoading(false); return; }
        const loginRes = await signIn('customer-credentials', { redirect: false, email: authForm.email, password: authForm.password });
        if (loginRes?.error) { setAuthMode('login'); setAuthError('Account created! Please sign in.'); setAuthLoading(false); return; }
        setIsLoggedIn(true); setShowAuthModal(false); setAuthForm({ name: '', email: '', phone: '', password: '' });
      } else {
        const res = await signIn('customer-credentials', { redirect: false, email: authForm.email, password: authForm.password });
        if (res?.error) { setAuthError('Invalid email or password'); setAuthLoading(false); return; }
        setIsLoggedIn(true); setShowAuthModal(false); setAuthForm({ name: '', email: '', phone: '', password: '' });
      }
    } catch { setAuthError('An error occurred. Please try again.'); }
    setAuthLoading(false);
  };

  const submitOrder = async (guestOverride?: { name: string; phone: string }) => {
    if (cart.length === 0) return;
    const effectiveGuest = guestOverride || guestInfo;
    if (!isLoggedIn && !effectiveGuest) { setShowCart(false); setShowAuthModal(true); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          notes: null,
          tableToken,
          ...(!isLoggedIn && effectiveGuest ? { guestName: effectiveGuest.name, guestPhone: effectiveGuest.phone } : {}),
        }),
      });
      if (res.ok) { setCart([]); setShowCart(false); setOrderSuccess(true); setTimeout(() => setOrderSuccess(false), 5000); }
      else { const data = await res.json(); if (res.status === 401) { setShowCart(false); setShowAuthModal(true); } else { alert(data.error || 'Failed to place order.'); } }
    } catch { alert('Failed to place order.'); }
    setSubmitting(false);
  };

  const handlePlaceOrder = () => submitOrder();

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestForm.name.trim();
    const phone = guestForm.phone.trim();
    if (!name || !phone) { setAuthError('Name and phone are required'); return; }
    setAuthError('');
    const info = { name, phone };
    setGuestInfo(info);
    setShowAuthModal(false);
    await submitOrder(info);
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, getCartQty, cartTotal, cartCount,
      showCart, setShowCart,
      isLoggedIn, showAuthModal, setShowAuthModal, authMode, setAuthMode, authForm, setAuthForm, authError, authLoading, handleAuth,
      guestInfo, guestForm, setGuestForm, handleGuestCheckout,
      submitting, orderSuccess, handlePlaceOrder,
      tableToken, tableLabel,
    }}>
      {children}
    </CartContext.Provider>
  );
}
