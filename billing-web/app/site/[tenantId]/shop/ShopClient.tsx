"use client";

import { useState, useCallback, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ChevronRight, UtensilsCrossed } from 'lucide-react';
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

export default function ShopClient({ categorizedProducts, layoutStyle, config }: ShopClientProps) {
  const theme = getMenuTheme(layoutStyle, config);
  const isList = theme.id === 'LIST';
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

  // Add to cart control — a quiet outline pill for List, a filled pill for Grid.
  const AddToCartButton = ({ product, variant }: { product: any; variant?: any }) => {
    const vid = variant?.id;
    const qty = getCartQty(product.id, vid);
    // SERVICE/COMBO never carry a meaningful stock number — see the matching comment in
    // CartContext.addToCart.
    const stock = (product.productType === 'SERVICE' || product.productType === 'COMBO')
      ? Infinity
      : (variant ? variant.stock : product.stock);
    const isOutOfStock = stock <= 0 && product.productType !== 'VARIANT' && product.productType !== 'SERVICE' && product.productType !== 'COMBO';

    if (isOutOfStock) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--muted)] border border-[var(--line)]">
          Sold out
        </span>
      );
    }

    if (qty === 0) {
      return (
        <button onClick={() => addToCart(product, variant)}
          className={`flex items-center gap-1 px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
            isList
              ? 'rounded-full border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white'
              : 'rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-sm hover:opacity-90'
          }`}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      );
    }

    return (
      <div className={`flex items-center gap-0 rounded-full overflow-hidden ${isList ? 'border border-[var(--primary)]' : 'bg-[var(--accent)] shadow-sm'}`}>
        <button onClick={() => qty === 1 ? removeFromCart(product.id, vid) : updateQuantity(product.id, -1, vid)}
          className={`w-7 h-7 flex items-center justify-center transition-colors ${isList ? 'text-[var(--primary)] hover:bg-[var(--primary)]/10' : 'text-[var(--accent-ink)] hover:brightness-95'}`}>
          {qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        </button>
        <span className={`text-xs font-black min-w-[22px] text-center ${isList ? 'text-[var(--primary)]' : 'text-[var(--accent-ink)]'}`}>{qty}</span>
        <button onClick={() => updateQuantity(product.id, 1, vid)} disabled={qty >= stock}
          className={`w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30 ${isList ? 'text-[var(--primary)] hover:bg-[var(--primary)]/10' : 'text-[var(--accent-ink)] hover:brightness-95'}`}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Product row — List: quiet divider row, no card, image only if the product has one. Grid:
  // elevated card with a placeholder image slot (never per-category emoji — a single consistent
  // icon reads as "no photo yet", not as grocery-app category browsing).
  const ProductRow = ({ item }: { item: any }) => {
    const hasVariants = item.variants && item.variants.length > 0;

    if (isList) {
      return (
        <div className="flex items-start gap-4 py-1">
          {item.imageUrl && (
            <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15.5px] font-semibold truncate text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</h3>
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
              <span className="inline-block mt-1.5 text-[9px] font-bold text-[var(--muted)] border border-[var(--line)] px-1.5 py-0.5 rounded-full">Sold out</span>
            )}
            {hasVariants && (
              <div className="mt-2 space-y-1.5">
                {item.variants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{v.name}</span>
                      <span className="text-xs font-semibold text-[var(--primary)]">₹{v.salePrice.toFixed(0)}</span>
                      {v.stock <= 0 && <span className="text-[9px] text-[var(--muted)]">Out</span>}
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
        <div className="w-16 h-16 rounded-xl bg-[var(--bg)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <UtensilsCrossed className="w-5 h-5 text-[var(--muted)] opacity-50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>{item.name}</h3>
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
            <span className="text-sm font-black text-[var(--ink)]">₹{item.salePrice.toFixed(0)}</span>
            {item.mrp > item.salePrice && (
              <span className="text-[10px] text-[var(--muted)] line-through">₹{item.mrp.toFixed(0)}</span>
            )}
            {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && item.productType !== 'COMBO' && (
              <span className="text-[9px] font-bold text-[var(--muted)] border border-[var(--line)] px-1.5 py-0.5 rounded-full">Sold out</span>
            )}
          </div>
          {hasVariants && (
            <div className="mt-1.5 space-y-1">
              {item.variants.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--muted)]">{v.name}</span>
                    <span className="text-[10px] font-bold text-[var(--ink)]">₹{v.salePrice.toFixed(0)}</span>
                    {v.stock <= 0 && <span className="text-[9px] text-[var(--muted)]">Out</span>}
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
      <div className={`sticky top-[57px] z-20 ${isList ? 'bg-[var(--bg)] border-b border-[var(--line)]' : 'bg-[var(--primary)]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isList ? 'text-[var(--muted)]' : 'text-gray-400'}`} />
            <input type="text" placeholder={isList ? 'Search the menu...' : 'Search products...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-1 ${
                isList
                  ? 'bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] placeholder-[var(--muted)] focus:ring-[var(--primary)]'
                  : 'bg-white border-transparent text-gray-900 placeholder-gray-400 focus:ring-black/10 shadow-sm'
              }`} />
          </div>
        </div>
      </div>

      {/* Main Content: Split Panel */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Left Sidebar - Categories (hidden on mobile, shown on md+) */}
        <div className="hidden md:block w-[180px] lg:w-[200px] border-r border-[var(--line)] sticky top-[113px] h-[calc(100vh-113px)] overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {filteredData.map(cat => {
              const active = activeCategory === cat.category;
              return (
                <button key={cat.category} onClick={() => scrollToCategory(cat.category)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                    isList
                      ? `border-l-2 ${active ? 'border-[var(--primary)]' : 'border-transparent hover:border-[var(--line)]'}`
                      : `rounded-xl ${active ? 'bg-[var(--primary)] text-[var(--primary-ink)]' : 'text-[var(--muted)] hover:bg-black/5'}`
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isList ? (active ? 'text-[var(--ink)]' : 'text-[var(--muted)]') : ''}`} style={isList ? { fontFamily: 'var(--font-display)' } : undefined}>
                      {cat.category}
                    </p>
                    <p className={`text-[9px] ${isList ? 'text-[var(--muted)]' : (active ? 'text-[var(--primary-ink)] opacity-75' : 'text-[var(--muted)]')}`}>{cat.items.length} items</p>
                  </div>
                  {!isList && active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Category Tabs */}
        <div className={`md:hidden fixed top-[113px] left-0 right-0 z-20 border-b border-[var(--line)] shadow-sm ${isList ? 'bg-[var(--bg)]' : 'bg-white'}`}>
          <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1.5">
            {filteredData.map(cat => {
              const active = activeCategory === cat.category;
              return (
                <button key={cat.category} onClick={() => scrollToCategory(cat.category)}
                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    isList
                      ? `border-b-2 ${active ? 'border-[var(--primary)] text-[var(--ink)]' : 'border-transparent text-[var(--muted)]'}`
                      : `rounded-xl ${active ? 'bg-[var(--primary)] text-[var(--primary-ink)]' : 'bg-[var(--bg)] text-[var(--muted)]'}`
                  }`}>
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
                  <div className={`sticky top-0 md:top-4 z-10 py-2 mb-3 ${isList ? 'bg-[var(--bg)]' : 'bg-[var(--bg)]'}`}>
                    <div className="flex items-center gap-2">
                      <h2 className={isList ? 'text-base font-semibold text-[var(--page-ink)]' : 'text-base font-black text-[var(--page-ink)]'} style={{ fontFamily: 'var(--font-display)' }}>{cat.category}</h2>
                      <span className="text-[10px] font-bold text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-full">{cat.items.length}</span>
                    </div>
                  </div>

                  <div className={isList ? 'divide-y divide-[var(--line)]' : 'space-y-2'}>
                    {cat.items.map((item, idx) => (
                      <div key={item.id} className={isList ? (idx === 0 ? 'pb-4' : 'py-4') : ''}>
                        <ProductRow item={item} />
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
