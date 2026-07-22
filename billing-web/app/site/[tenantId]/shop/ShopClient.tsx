"use client";

import { useState, useCallback, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import { getMenuTheme, menuThemeCssVars } from '@/lib/website/menuTheme';
import { WebsiteConfig } from '@/lib/website/types';
import { useCart } from '@/components/website/CartContext';

interface ShopClientProps {
  categorizedProducts: {
    category: string;
    items: any[];
  }[];
  layoutStyle: string | null;
  config: WebsiteConfig;
}

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

export default function ShopClient({ categorizedProducts, layoutStyle, config }: ShopClientProps) {
  const theme = getMenuTheme(layoutStyle, config);
  const isRestaurant = theme.id === 'RESTAURANT';
  const { addToCart, removeFromCart, updateQuantity, getCartQty } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(categorizedProducts[0]?.category || '');
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const productContainerRef = useRef<HTMLDivElement>(null);

  const filteredData = categorizedProducts.map(cat => ({
    category: cat.category,
    items: cat.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

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

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const el = categoryRefs.current.get(category);
    if (el && productContainerRef.current) {
      productContainerRef.current.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    }
  };

  // Add to cart control — a boxy stepper for Market, a soft pill for Restaurant.
  const AddToCartButton = ({ product, variant }: { product: any; variant?: any }) => {
    const vid = variant?.id;
    const qty = getCartQty(product.id, vid);
    // SERVICE/COMBO never carry a meaningful stock number — see the matching comment in
    // CartContext.addToCart.
    const stock = (product.productType === 'SERVICE' || product.productType === 'COMBO')
      ? Infinity
      : (variant ? variant.stock : product.stock);
    const isOutOfStock = stock <= 0 && product.productType !== 'VARIANT' && product.productType !== 'SERVICE' && product.productType !== 'COMBO';
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
            {item.productType === 'COMBO' && item.comboComponents && item.comboComponents.length > 0 && (
              <p className="text-[11px] text-[var(--muted)] mt-1">
                Includes: {item.comboComponents.map((c: any, idx: number) => (
                  <span key={idx}>{idx > 0 ? ', ' : ''}{c.quantity}× {c.component?.name}{c.componentVariant ? ` (${c.componentVariant.name})` : ''}</span>
                ))}
              </p>
            )}
            {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && item.productType !== 'COMBO' && (
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
          {item.productType === 'COMBO' && item.comboComponents && item.comboComponents.length > 0 && (
            <p className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">
              Includes: {item.comboComponents.map((c: any, idx: number) => (
                <span key={idx}>{idx > 0 ? ', ' : ''}{c.quantity}× {c.component?.name}{c.componentVariant ? ` (${c.componentVariant.name})` : ''}</span>
              ))}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-black">₹{item.salePrice.toFixed(0)}</span>
            {item.mrp > item.salePrice && (
              <span className="text-[10px] text-[var(--muted)] line-through">₹{item.mrp.toFixed(0)}</span>
            )}
            {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && item.productType !== 'COMBO' && (
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
    <div className="flex-1 flex flex-col" style={menuThemeCssVars(theme)}>
      {/* Search bar */}
      <div className={`sticky top-[57px] z-20 ${isRestaurant ? 'bg-[var(--surface)] border-b border-[var(--line)]' : 'bg-[var(--primary)]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isRestaurant ? 'text-[var(--muted)]' : 'text-gray-400'}`} />
            <input type="text" placeholder={isRestaurant ? 'Search the menu...' : 'Search products...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                isRestaurant
                  ? 'bg-[var(--bg)] border-[var(--line)] text-[var(--ink)] placeholder-[var(--muted)] focus:ring-[var(--primary)]'
                  : 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] placeholder-gray-400 focus:ring-black/10 shadow-sm'
              }`} />
          </div>
        </div>
      </div>

      {/* Main Content: Split Panel */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Left Sidebar - Categories (hidden on mobile, shown on md+) */}
        <div className="hidden md:block w-[180px] lg:w-[200px] bg-[var(--surface)] border-r border-[var(--line)] sticky top-[113px] h-[calc(100vh-113px)] overflow-y-auto">
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
        <div className="md:hidden fixed top-[113px] left-0 right-0 z-20 bg-[var(--surface)] border-b border-[var(--line)] shadow-sm">
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
          className="flex-1 overflow-y-auto md:pt-4 pt-[52px] pb-24 px-4 md:px-6">
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--muted)] font-semibold text-sm">No items found</p>
              <p className="text-[var(--muted)] opacity-60 text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredData.map(cat => (
                <div key={cat.category} ref={(el) => { if (el) categoryRefs.current.set(cat.category, el); }}>
                  <div className="sticky top-0 md:top-4 z-10 bg-[var(--bg)] py-2 mb-3">
                    <div className="flex items-center gap-2">
                      {!isRestaurant && <span className="text-xl">{getCategoryIcon(cat.category)}</span>}
                      <h2 className={isRestaurant ? 'text-base font-semibold' : 'text-base font-black'} style={{ fontFamily: 'var(--font-display)' }}>{cat.category}</h2>
                      <span className="text-[10px] font-bold text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 rounded-full">{cat.items.length}</span>
                    </div>
                  </div>

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
    </div>
  );
}
