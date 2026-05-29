"use client";

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface MenuClientProps {
  tenant: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  categorizedProducts: {
    category: string;
    items: any[];
  }[];
  theme: string;
}

const themeConfig: Record<string, any> = {
  DEFAULT: {
    wrapper: "min-h-screen bg-gray-50 pb-20 font-sans text-gray-900",
    header: "bg-white shadow-sm sticky top-0 z-10",
    headerTitle: "text-2xl font-extrabold text-gray-900",
    headerSub: "text-sm text-gray-500",
    searchBox: "w-full pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900",
    categoryTitle: "text-xl font-bold text-gray-900 mb-4 px-1",
    card: "bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col",
    cardTitle: "font-semibold text-gray-900",
    priceText: "font-bold text-gray-900",
    variantWrap: "mt-3 space-y-2 border-t border-gray-50 pt-3",
    variantItem: "flex justify-between items-center text-sm",
    variantName: "text-gray-600",
    variantPrice: "font-medium text-gray-900",
  },
  DARK: {
    wrapper: "min-h-screen bg-slate-900 pb-20 font-sans text-slate-100",
    header: "bg-slate-800 shadow-md sticky top-0 z-10 border-b border-slate-700",
    headerTitle: "text-2xl font-bold text-white",
    headerSub: "text-sm text-slate-400",
    searchBox: "w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-slate-400",
    categoryTitle: "text-xl font-bold text-white mb-4 px-1",
    card: "bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-700 flex flex-col",
    cardTitle: "font-semibold text-white",
    priceText: "font-bold text-indigo-400",
    variantWrap: "mt-3 space-y-2 border-t border-slate-700 pt-3",
    variantItem: "flex justify-between items-center text-sm",
    variantName: "text-slate-300",
    variantPrice: "font-medium text-indigo-300",
  },
  ELEGANT: {
    wrapper: "min-h-screen bg-[#fcfbf9] pb-20 font-serif text-stone-900",
    header: "bg-[#fcfbf9] sticky top-0 z-10 border-b border-stone-200",
    headerTitle: "text-3xl font-normal tracking-wide text-stone-900",
    headerSub: "text-sm text-stone-500 tracking-wider uppercase",
    searchBox: "w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-none focus:ring-1 focus:ring-stone-400 outline-none text-stone-900 placeholder-stone-400",
    categoryTitle: "text-2xl font-normal text-stone-900 mb-6 px-1 tracking-widest uppercase border-b border-stone-200 pb-2",
    card: "bg-white p-5 border border-stone-100 shadow-sm flex flex-col",
    cardTitle: "font-medium text-lg text-stone-900",
    priceText: "text-stone-900 italic",
    variantWrap: "mt-3 space-y-2 border-t border-stone-100 pt-3",
    variantItem: "flex justify-between items-center text-sm",
    variantName: "text-stone-600 italic",
    variantPrice: "text-stone-900",
  },
  PLAYFUL: {
    wrapper: "min-h-screen bg-pink-50 pb-20 font-sans text-pink-950",
    header: "bg-yellow-300 sticky top-0 z-10 border-b-4 border-pink-900 rounded-b-3xl shadow-sm",
    headerTitle: "text-2xl font-black text-pink-900 uppercase tracking-tight",
    headerSub: "text-sm text-pink-800 font-medium",
    searchBox: "w-full pl-12 pr-4 py-3 bg-white border-2 border-pink-200 shadow-[4px_4px_0px_0px_rgba(252,165,165,1)] rounded-full focus:outline-none focus:border-pink-400 text-pink-900 placeholder-pink-300 font-medium",
    categoryTitle: "text-2xl font-black text-pink-900 mb-4 px-1 uppercase",
    card: "bg-white rounded-3xl p-5 border-2 border-pink-200 shadow-[4px_4px_0px_0px_rgba(252,165,165,1)] flex flex-col hover:-translate-y-1 transition-transform",
    cardTitle: "font-black text-lg text-pink-900",
    priceText: "font-black text-pink-600 bg-pink-100 px-3 py-1 rounded-full text-sm inline-block",
    variantWrap: "mt-4 space-y-2 pt-3",
    variantItem: "flex justify-between items-center text-sm bg-pink-50 p-2 rounded-xl",
    variantName: "text-pink-800 font-semibold",
    variantPrice: "font-black text-pink-600",
  }
};

export default function MenuClient({ tenant, categorizedProducts, theme }: MenuClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const tConfig = themeConfig[theme] || themeConfig['DEFAULT'];

  const filteredData = categorizedProducts.map(cat => ({
    category: cat.category,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className={tConfig.wrapper}>
      {/* Header */}
      <header className={tConfig.header}>
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <h1 className={tConfig.headerTitle}>{tenant.name}</h1>
          {tenant.address && (
            <p className={`${tConfig.headerSub} mt-2 flex items-center justify-center gap-1`}>
              <MapPin className="w-4 h-4 opacity-70" />
              {tenant.address}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
          <input
            type="text"
            placeholder="Search the menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={tConfig.searchBox}
          />
        </div>

        {/* Menu Categories */}
        {filteredData.length === 0 ? (
          <div className="text-center opacity-60 py-10">
            No items found matching "{searchTerm}"
          </div>
        ) : (
          <div className="space-y-10">
            {filteredData.map(cat => (
              <section key={cat.category}>
                <h2 className={tConfig.categoryTitle}>{cat.category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {cat.items.map(item => (
                    <div key={item.id} className={tConfig.card}>
                      
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className={tConfig.cardTitle}>{item.name}</h3>
                          {item.stock <= 0 && item.productType !== 'VARIANT' && item.productType !== 'SERVICE' && (
                            <span className="inline-block mt-1 text-[10px] font-bold tracking-wider text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded">
                              Sold Out
                            </span>
                          )}
                        </div>
                        {/* Only show master price if it has no variants or if it's not a weight-based master */}
                        {!(item.variants && item.variants.length > 0) && (
                          <div className="text-right">
                            <span className={tConfig.priceText}>₹{item.salePrice.toFixed(2)}</span>
                            {item.mrp > item.salePrice && (
                              <div className="text-xs opacity-50 line-through mt-0.5">₹{item.mrp.toFixed(2)}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Display Variants if they exist */}
                      {item.variants && item.variants.length > 0 && (
                        <div className={tConfig.variantWrap}>
                          {item.variants.map((v: any) => (
                            <div key={v.id} className={tConfig.variantItem}>
                              <span className={tConfig.variantName}>{v.name}</span>
                              <div className="text-right">
                                <span className={tConfig.variantPrice}>₹{v.salePrice.toFixed(2)}</span>
                                {v.mrp > v.salePrice && (
                                  <span className="text-[10px] opacity-50 line-through ml-2">₹{v.mrp.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs opacity-40 font-sans">
        Powered by BillingApp
      </footer>
    </div>
  );
}
