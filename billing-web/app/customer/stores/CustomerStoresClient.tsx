"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, MapPin, ShoppingBag, Star, ArrowRight, Loader2, Phone, Search } from "lucide-react";

interface StoreData {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  loyaltyPoints: number;
}

const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

export default function CustomerStoresClient() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/customer/stores")
      .then((r) => r.json())
      .then((d) => { setStores(d.stores || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = stores.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 text-[#FFE11B] animate-spin" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-xl font-black text-[#2D2D2D] mb-1">My Stores</h1>
      <p className="text-xs text-gray-500 mb-4">Tap a store to browse & order</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B]/50 focus:border-[#FFE11B] shadow-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#2D2D2D]">No stores yet</p>
          <p className="text-xs text-gray-400 mt-1">Scan a store QR to start</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((store, i) => (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Store Header with gradient */}
              <div className={`bg-gradient-to-r ${gradients[i % gradients.length]} p-4`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Store className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">{store.name}</h3>
                    {store.address && (
                      <p className="text-[10px] text-white/70 flex items-center gap-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5" /> {store.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-white/80" />
                    <span className="text-[10px] font-bold text-white">{store.orderCount} orders</span>
                  </div>
                  <div className="bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white">₹{store.totalSpent.toFixed(0)}</span>
                    <span className="text-[10px] text-white/70">spent</span>
                  </div>
                  {store.loyaltyPoints > 0 && (
                    <div className="bg-white/15 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-300" fill="currentColor" />
                      <span className="text-[10px] font-bold text-white">{store.loyaltyPoints} pts</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex">
                <Link href={`/menu/${store.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black text-[#2D2D2D] hover:bg-gray-50 transition-colors">
                  Browse Menu <ArrowRight className="w-3 h-3" />
                </Link>
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="px-5 flex items-center justify-center gap-1 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 border-l border-gray-100 transition-colors">
                    <Phone className="w-3 h-3" /> Call
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
