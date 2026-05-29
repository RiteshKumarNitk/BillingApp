"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

interface MenuClientProps {
  categorizedProducts: {
    category: string;
    items: any[];
  }[];
}

export default function MenuClient({ categorizedProducts }: MenuClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = categorizedProducts.map(cat => ({
    category: cat.category,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search the menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-0 shadow-sm rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
        />
      </div>

      {/* Menu Categories */}
      {filteredData.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No items found matching "{searchTerm}"
        </div>
      ) : (
        <div className="space-y-8">
          {filteredData.map(cat => (
            <section key={cat.category}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-1">{cat.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.stock <= 0 && (
                        <span className="inline-block mt-1 text-[10px] font-bold tracking-wider text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">₹{item.salePrice.toFixed(2)}</span>
                      {item.mrp > item.salePrice && (
                        <div className="text-xs text-gray-400 line-through">₹{item.mrp.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
