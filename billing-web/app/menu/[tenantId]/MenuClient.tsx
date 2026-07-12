"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search, MapPin, Plus, Minus, ShoppingCart, X, Trash2, Navigation,
  User, Mail, Lock, Phone, LogIn, ExternalLink, ChevronRight, Store
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import { getMenuTheme, menuThemeCssVars } from './menuThemes';

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  salePrice: number;
  quantity: number;
  stock: number;
}

interface MenuClientProps {
  tenantId: string;
  tenant: {
    name: string;
    address: string | null;
    phone: string | null;
    latitude?: number | null;
    longitude?: number | null;
    logoUrl?: string | null;
    tagline?: string | null;
    aboutText?: string | null;
    coverImageUrl?: string | null;
    businessHours?: string | null;
  };
  categorizedProducts: {
    category: string;
    items: any[];
  }[];
  theme: string | null;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'vegetables': '🥬', 'fruits': '🍎', 'dairy': '🥛', 'bread': '🍞',
  'meat': '🥩', 'fish': '🐟', 'snacks': '🍿', 'drinks': '🥤',
  'grocery': '🛒', 'bakery': '🧁', 'beverages': '☕', 'ice cream': '🍦',
  'cleaning': '🧹', 'personal care': '🧴', 'baby care': '👶', 'pet care': '🐾',
  'spices': '🌶️', 'rice': '🍚', 'pulses': '🫘', 'oils': '🫒',
  'noodles': '🍜', 'biscuits': '🍪', 'chocolate': '🍫', 'chips': '🥔',
  'starters': '🥟', 'mains': '🍛', 'breads': '🫓', 'desserts': '🍮',
  'other': '📦',
};

function getCategoryIcon(cat: string) {
  const lower = cat.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
}

export default function MenuClient({ tenantId, tenant, categorizedProducts, theme: themeValue }: MenuClientProps) {
  const theme = getMenuTheme(themeValue);
  const isRestaurant = theme.id === 'RESTAURANT';

  const [searchTerm, setSearchTerm] = useState('');
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
  const [showMap, setShowMap] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categorizedProducts[0]?.category || '');
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const productContainerRef = useRef<HTMLDivElement>(null);

  // Check if customer is logged in on mount
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

  // Filter products based on search
  const filteredData = categorizedProducts.map(cat => ({
    category: cat.category,
    items: cat.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  // Handle scroll to detect active category
  const handleScroll = useCallback(() => {
    if (!productContainerRef.current) return;
    const container = productContainerRef.current;
    const scrollTop = container.scrollTop;

    for (let i = filteredData.length - 1; i >= 0; i--) {
      const el = categoryRefs.current.get(filteredData[i].category);
      if (el && el.offsetTop - 100 <= scrollTop) {
        setActiveCategory(filteredData[i].category);
        break;
      }
    }
  }, [filteredData]);

  // Scroll to category
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const el = categoryRefs.current.get(category);
    if (el && productContainerRef.current) {
      productContainerRef.current.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    }
  };

  // Cart operations
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

  const getCartQty = (productId: string, variantId?: string) => {
    const item = cart.find(i =>
      variantId ? (i.productId === productId && i.variantId === variantId) : i.productId === productId
    );
    return item?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Auth handlers
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

  const getDirectionsUrl = () => {
    if (tenant.latitude && tenant.longitude) return `https://www.google.com/maps/dir/?api=1&destination=${tenant.latitude},${tenant.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tenant.address || tenant.name)}`;
  };

  const scrollToMenu = () => {
    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add to cart control — a boxy stepper for Market, a soft pill for Restaurant.
  const AddToCartButton = ({ product, variant }: { product: any; variant?: any }) => {
    const vid = variant?.id;
    const qty = getCartQty(product.id, vid);
    const stock = variant ? variant.stock : product.stock;
    const isOutOfStock = stock <= 0 && product.productType !== 'VARIANT' && product.productType !== 'SERVICE';
    const shape = isRestaurant ? 'rounded-full' : 'rounded-xl';

    if (isOutOfStock) {
      return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isRestaurant ? 'text-red-400 bg-red-950/40' : 'text-red-500 bg-red-50'}`}>
          Out of Stock
        </span>
      );
    }

    if (qty === 0) {
      return (
        <button onClick={() => addToCart(product, variant)}
          className={`flex items-center gap-1 bg-[var(--accent)] text-[var(--accent-ink)] px-4 py-2 ${shape} text-xs font-black hover:opacity-90 transition-all shadow-sm active:scale-95`}>
          <Plus className="w-3.5 h-3.5" /> {isRestaurant ? 'Add' : 'ADD'}
        </button>
      );
    }

    return (
      <div className={`flex items-center gap-0 bg-[var(--accent)] ${shape} overflow-hidden shadow-sm`}>
        <button onClick={() => qty === 1 ? removeFromCart(product.id, vid) : updateQuantity(product.id, -1, vid)}
          className="w-8 h-8 flex items-center justify-center text-[var(--accent-ink)] hover:brightness-95 transition-colors">
          {qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        </button>
        <span className="text-xs font-black text-[var(--accent-ink)] min-w-[24px] text-center">{qty}</span>
        <button onClick={() => updateQuantity(product.id, 1, vid)} disabled={qty >= stock}
          className="w-8 h-8 flex items-center justify-center text-[var(--accent-ink)] hover:brightness-95 transition-colors disabled:opacity-30">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Product row — Market: compact list row. Restaurant: spacious dish card with description.
  const ProductRow = ({ item, cat }: { item: any; cat: { category: string } }) => {
    const hasVariants = item.variants && item.variants.length > 0;

    if (isRestaurant) {
      return (
        <div className="flex items-start gap-4 py-1">
          <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl bg-gradient-to-br from-[var(--line)] to-[var(--surface)]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span>{getCategoryIcon(cat.category)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15.5px] font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</h3>
              {!hasVariants && (
                <span className="text-sm font-semibold text-[var(--primary)] flex-shrink-0">₹{item.salePrice.toFixed(0)}</span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-[var(--muted)] italic mt-1 leading-relaxed line-clamp-2">{item.description}</p>
            )}
            {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && (
              <span className="inline-block mt-1.5 text-[9px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded">SOLD OUT</span>
            )}
            {hasVariants && (
              <div className="mt-2 space-y-1.5">
                {item.variants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{v.name}</span>
                      <span className="text-xs font-semibold text-[var(--primary)]">₹{v.salePrice.toFixed(0)}</span>
                      {v.stock <= 0 && <span className="text-[9px] text-red-400">Out</span>}
                    </div>
                    <AddToCartButton product={item} variant={v} />
                  </div>
                ))}
              </div>
            )}
            {!hasVariants && (
              <div className="mt-2">
                <AddToCartButton product={item} />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-3 flex items-center gap-3 shadow-sm">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--line)] to-[var(--surface)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{getCategoryIcon(cat.category)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</h3>
          {item.description && (
            <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-black">₹{item.salePrice.toFixed(0)}</span>
            {item.mrp > item.salePrice && (
              <span className="text-[10px] text-[var(--muted)] line-through">₹{item.mrp.toFixed(0)}</span>
            )}
            {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && (
              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">SOLD OUT</span>
            )}
          </div>
          {hasVariants && (
            <div className="mt-1.5 space-y-1">
              {item.variants.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--muted)]">{v.name}</span>
                    <span className="text-[10px] font-bold">₹{v.salePrice.toFixed(0)}</span>
                    {v.stock <= 0 && <span className="text-[9px] text-red-500">Out</span>}
                  </div>
                  <AddToCartButton product={item} variant={v} />
                </div>
              ))}
            </div>
          )}
        </div>
        {!hasVariants && (
          <div className="flex-shrink-0">
            <AddToCartButton product={item} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col"
      style={{ ...menuThemeCssVars(theme), fontFamily: isRestaurant ? undefined : 'var(--font-display)' }}
    >
      {/* Hero — establishes this as the tenant's own business page, not just a product list */}
      <section
        className="relative bg-cover bg-center"
        style={tenant.coverImageUrl ? { backgroundImage: `url(${tenant.coverImageUrl})` } : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: tenant.coverImageUrl
              ? 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)'
              : 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 55%, black) 100%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-14">
          <div className={`w-16 h-16 flex items-center justify-center flex-shrink-0 overflow-hidden mb-5 ring-2 ring-[var(--primary-ink)]/25 ${isRestaurant ? 'rounded-full bg-[var(--surface)]' : 'rounded-2xl bg-[var(--accent)]'}`}>
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
            ) : isRestaurant ? (
              <span className="text-xl font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {tenant.name.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <Store className="w-7 h-7 text-[var(--accent-ink)]" />
            )}
          </div>
          <h1
            className={`text-[var(--primary-ink)] text-balance ${isRestaurant ? 'text-3xl md:text-4xl font-semibold' : 'text-2xl md:text-3xl font-black'}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tenant.name}
          </h1>
          {tenant.tagline && (
            <p className={`text-[var(--primary-ink)]/85 mt-2 max-w-md ${isRestaurant ? 'italic' : 'font-medium'}`}>
              {tenant.tagline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {tenant.businessHours && (
              <span className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
                🕐 {tenant.businessHours}
              </span>
            )}
            {tenant.address && (
              <button
                onClick={() => setShowMap(true)}
                className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-3 h-3" /> {tenant.address}
              </button>
            )}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="text-xs font-semibold text-[var(--primary-ink)] bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3" /> {tenant.phone}
              </a>
            )}
          </div>
          <button
            onClick={scrollToMenu}
            className={`mt-7 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all bg-[var(--accent)] text-[var(--accent-ink)] ${isRestaurant ? 'rounded-full' : 'rounded-xl'}`}
          >
            {isRestaurant ? 'View Menu' : 'Shop Now'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* About — the business's own words, between the hero and the catalog */}
      {tenant.aboutText && (
        <section className="bg-[var(--surface)] border-b border-[var(--line)]">
          <div className="max-w-5xl mx-auto px-4 py-7 md:py-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
              {isRestaurant ? 'Our Story' : 'About Us'}
            </p>
            <p
              className={`text-[var(--ink)] max-w-2xl leading-relaxed ${isRestaurant ? 'text-base' : 'text-sm'}`}
              style={isRestaurant ? { fontFamily: 'var(--font-display)' } : undefined}
            >
              {tenant.aboutText}
            </p>
          </div>
        </section>
      )}

      {/* Header */}
      <header id="menu-section" className={`sticky top-0 z-30 shadow-sm ${isRestaurant ? 'bg-[var(--surface)] border-b border-[var(--line)]' : 'bg-[var(--primary)] text-[var(--primary-ink)]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
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
              <h1 className={isRestaurant ? 'text-base font-semibold' : 'text-sm font-black'} style={{ fontFamily: 'var(--font-display)' }}>
                {tenant.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="p-2 opacity-50 hover:opacity-100 hover:bg-black/5 rounded-xl transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          {!isRestaurant && (
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-2xl text-sm text-[var(--ink)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm" />
            </div>
          )}
        </div>
        {isRestaurant && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input type="text" placeholder="Search the menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
            </div>
          </div>
        )}
      </header>

      {/* Order Success Toast */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--ink)] text-[var(--bg)] px-6 py-3 rounded-2xl shadow-xl animate-slide-up flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-black">Order placed! Store will review.</span>
        </div>
      )}

      {/* Main Content: Split Panel */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Left Sidebar - Categories (hidden on mobile, shown on md+) */}
        <div className="hidden md:block w-[180px] lg:w-[200px] bg-[var(--surface)] border-r border-[var(--line)] sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {filteredData.map(cat => {
              const active = activeCategory === cat.category;
              return (
                <button key={cat.category} onClick={() => scrollToCategory(cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                    isRestaurant
                      ? `border-l-2 ${active ? 'border-[var(--primary)] bg-[var(--bg)]' : 'border-transparent hover:bg-[var(--bg)]'}`
                      : `rounded-xl ${active ? 'bg-[var(--primary)] text-[var(--primary-ink)] shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--bg)]'}`
                  }`}>
                  {!isRestaurant && <span className="text-lg">{getCategoryIcon(cat.category)}</span>}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isRestaurant ? (active ? 'text-[var(--ink)]' : 'text-[var(--muted)]') : ''}`} style={isRestaurant ? { fontFamily: 'var(--font-display)' } : undefined}>
                      {cat.category}
                    </p>
                    <p className={`text-[9px] ${isRestaurant ? 'text-[var(--muted)]' : 'text-gray-400'}`}>{cat.items.length} items</p>
                  </div>
                  {!isRestaurant && active && <ChevronRight className="w-3 h-3 opacity-40" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Category Tabs */}
        <div className="md:hidden fixed top-[120px] left-0 right-0 z-20 bg-[var(--surface)] border-b border-[var(--line)] shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1.5">
            {filteredData.map(cat => {
              const active = activeCategory === cat.category;
              return (
                <button key={cat.category} onClick={() => scrollToCategory(cat.category)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    isRestaurant
                      ? `border-b-2 ${active ? 'border-[var(--primary)] text-[var(--ink)]' : 'border-transparent text-[var(--muted)]'}`
                      : `rounded-xl ${active ? 'bg-[var(--primary)] text-[var(--primary-ink)] shadow-sm' : 'bg-[var(--bg)] text-[var(--muted)]'}`
                  }`}>
                  {!isRestaurant && <span className="text-sm">{getCategoryIcon(cat.category)}</span>}
                  {cat.category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Products */}
        <div ref={productContainerRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto md:pt-4 pt-[160px] pb-24 px-4 md:px-6">
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--muted)] font-semibold text-sm">No items found</p>
              <p className="text-[var(--muted)] opacity-60 text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredData.map(cat => (
                <div key={cat.category} ref={(el) => { if (el) categoryRefs.current.set(cat.category, el); }}>
                  {/* Category Header */}
                  <div className="sticky top-0 md:top-4 z-10 bg-[var(--bg)] py-2 mb-3">
                    <div className="flex items-center gap-2">
                      {!isRestaurant && <span className="text-xl">{getCategoryIcon(cat.category)}</span>}
                      <h2 className={isRestaurant ? 'text-base font-semibold' : 'text-base font-black'} style={{ fontFamily: 'var(--font-display)' }}>{cat.category}</h2>
                      <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full">{cat.items.length}</span>
                    </div>
                  </div>

                  {/* Products */}
                  <div className={isRestaurant ? 'divide-y divide-[var(--line)]' : 'space-y-2'}>
                    {cat.items.map((item, idx) => (
                      <div key={item.id} className={isRestaurant ? (idx === 0 ? 'pb-4' : 'py-4') : ''}>
                        <ProductRow item={item} cat={cat} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
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
      )}

      {/* Cart Drawer */}
      {showCart && (
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
                    <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer" className="font-bold whitespace-nowrap flex items-center gap-0.5">
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
      )}

      {/* Auth Modal */}
      {showAuthModal && (
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
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]">
                {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowMap(false)} />
          <div className="relative bg-[var(--surface)] text-[var(--ink)] rounded-t-3xl md:rounded-3xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
              <h3 className="font-black text-sm">Store Location</h3>
              <button onClick={() => setShowMap(false)} className="p-1 hover:bg-black/5 rounded-lg"><X className="w-4 h-4 text-[var(--muted)]" /></button>
            </div>
            <div className="p-4 space-y-3">
              <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-black hover:opacity-90 transition-colors shadow-sm">
                <Navigation className="w-4 h-4" /> Get Directions
              </a>
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--bg)] text-[var(--ink)] text-sm font-bold hover:brightness-95 transition-colors">
                  <Phone className="w-4 h-4" /> Call Store
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="text-center py-4 text-[9px] text-[var(--muted)] font-semibold opacity-60">Powered by BillingApp</footer>
    </div>
  );
}
