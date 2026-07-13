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
  authMode: 'login' | 'register';
  setAuthMode: (v: 'login' | 'register') => void;
  authForm: { name: string; email: string; phone: string; password: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; password: string }>>;
  authError: string;
  authLoading: boolean;
  handleAuth: (e: React.FormEvent) => Promise<void>;

  submitting: boolean;
  orderSuccess: boolean;
  handlePlaceOrder: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// Owns cart + customer-auth + checkout state for the whole tenant site (Home/Shop/About/Contact).
// Lives in MenuShell, which wraps every page under app/menu/[tenantId]/layout.tsx, so the cart
// survives client-side navigation between pages instead of resetting per-page.
export function CartProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  const addToCart = useCallback((product: any, variant?: any) => {
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    const price = variant ? variant.salePrice : product.salePrice;
    const stock = variant ? variant.stock : product.stock;
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

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!isLoggedIn) { setShowCart(false); setShowAuthModal(true); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })), notes: null }),
      });
      if (res.ok) { setCart([]); setShowCart(false); setOrderSuccess(true); setTimeout(() => setOrderSuccess(false), 5000); }
      else { const data = await res.json(); if (res.status === 401) { setShowCart(false); setShowAuthModal(true); } else { alert(data.error || 'Failed to place order.'); } }
    } catch { alert('Failed to place order.'); }
    setSubmitting(false);
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, getCartQty, cartTotal, cartCount,
      showCart, setShowCart,
      isLoggedIn, showAuthModal, setShowAuthModal, authMode, setAuthMode, authForm, setAuthForm, authError, authLoading, handleAuth,
      submitting, orderSuccess, handlePlaceOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
}
