"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, TrendingUp, Star, Store,
  MapPin, ArrowRight, Loader2, RefreshCw, Zap, Search, Bell, Package, User
} from "lucide-react";

interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    rejectedOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
    storesOrderedFrom: number;
  };
  stores: { id: string; name: string; logoUrl: string | null; address: string | null; orderCount: number }[];
  recentOrders: {
    id: string;
    status: string;
    netAmount: number;
    createdAt: string;
    tenant: { name: string };
    items: { name: string; quantity: number }[];
  }[];
}

interface StatusChange {
  orderId: string;
  newStatus: string;
  storeName: string;
  amount: number;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  APPROVED: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Approved" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Completed" },
  REJECTED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Rejected" },
};

export default function CustomerDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Customer");
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [changedOrderIds, setChangedOrderIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const prevOrdersJsonRef = useRef("");
  const nameRef = useRef("Customer");

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [dashRes, sessionRes] = await Promise.all([
        fetch("/api/customer/dashboard"),
        nameRef.current === "Customer" ? fetch("/api/customer/auth/session") : Promise.resolve(null),
      ]);
      const dashData = await dashRes.json();
      if (sessionRes) {
        const sessData = await sessionRes.json();
        if (sessData.user?.name) { setName(sessData.user.name); nameRef.current = sessData.user.name; }
      }
      if (dashData.stats) {
        const currentJson = JSON.stringify(dashData.recentOrders?.map((o: any) => `${o.id}:${o.status}`) || []);
        if (prevOrdersJsonRef.current && prevOrdersJsonRef.current !== currentJson) {
          const prevMap = new Map<string, string>();
          prevOrdersJsonRef.current.split(",").forEach((s: string) => {
            const [id, status] = s.split(":");
            if (id && status) prevMap.set(id, status);
          });
          const changes: StatusChange[] = [];
          const changedIds = new Set<string>();
          dashData.recentOrders?.forEach((order: any) => {
            const prevStatus = prevMap.get(order.id);
            if (prevStatus && prevStatus !== order.status) {
              changes.push({ orderId: order.id, newStatus: order.status, storeName: order.tenant?.name || "Store", amount: order.netAmount });
              changedIds.add(order.id);
            }
          });
          if (changes.length > 0) {
            setStatusChanges((prev) => [...changes, ...prev].slice(0, 3));
            setChangedOrderIds(changedIds);
            setTimeout(() => setStatusChanges([]), 10000);
            setTimeout(() => setChangedOrderIds(new Set()), 5000);
          }
        }
        prevOrdersJsonRef.current = currentJson;
        setData(dashData);
      }
    } catch { /* silent */ }
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendingCountRef = useRef(0);
  useEffect(() => { pendingCountRef.current = data?.stats.pendingOrders || 0; }, [data?.stats.pendingOrders]);
  useEffect(() => {
    const tick = () => fetchData(false);
    const getInterval = () => pendingCountRef.current > 0 ? 15000 : 60000;
    let id = setInterval(tick, getInterval());
    const check = setInterval(() => { clearInterval(id); id = setInterval(tick, getInterval()); }, 60000);
    return () => { clearInterval(id); clearInterval(check); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[#FFE11B] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500">Failed to load.</p></div>;
  }

  const { stats, stores, recentOrders } = data;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good Morning" : greetingHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="max-w-lg mx-auto px-4 pb-6">
      {/* Status Change Toasts */}
      {statusChanges.length > 0 && (
        <div className="space-y-2 pt-3">
          {statusChanges.map((change) => {
            const config = statusConfig[change.newStatus] || statusConfig.PENDING;
            const Icon = config.icon;
            return (
              <div key={change.orderId} className={`bg-white rounded-2xl border-2 ${config.border} p-3 flex items-center gap-3 shadow-sm animate-slide-up`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#2D2D2D]">Order {config.label}!</p>
                  <p className="text-[10px] text-gray-500 truncate">{change.storeName} — ₹{change.amount.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Greeting */}
      <div className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">{greeting}</p>
            <h1 className="text-xl font-black text-[#2D2D2D]">{name.split(" ")[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            {stats.pendingOrders > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" /></span>
                <span className="text-[9px] font-bold text-amber-700">{stats.pendingOrders} pending</span>
              </div>
            )}
            <button onClick={() => fetchData(true)} disabled={isRefreshing} className="p-2 text-gray-400 hover:text-[#2D2D2D] hover:bg-white rounded-xl transition-colors">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search stores or items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-[#2D2D2D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFE11B]/50 focus:border-[#FFE11B] shadow-sm"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-indigo-50 text-indigo-600" },
          { label: "Completed", value: stats.completedOrders, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
          { label: "Loyalty Pts", value: stats.loyaltyPoints, icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "Total Spent", value: `₹${stats.totalSpent.toFixed(0)}`, icon: TrendingUp, color: "bg-violet-50 text-violet-600" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 min-w-[140px] shadow-sm">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-[#2D2D2D]">{stat.value}</p>
              <p className="text-[9px] font-semibold text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Grid - Zepto style */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-[#2D2D2D]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { href: "/customer/stores", icon: Store, label: "Stores", color: "from-blue-500 to-blue-600" },
            { href: "/customer/orders", icon: Package, label: "Orders", color: "from-emerald-500 to-emerald-600" },
            { href: "/customer/notifications", icon: Bell, label: "Alerts", color: "from-amber-500 to-orange-500" },
            { href: "/customer/profile", icon: User, label: "Profile", color: "from-violet-500 to-purple-600" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm active:scale-95 transition-transform`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-[#2D2D2D]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stores Section - Zepto horizontal scroll */}
      {stores.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-[#2D2D2D]">Your Stores</h2>
            <Link href="/customer/stores" className="text-[10px] font-bold text-[#FFE11B] hover:text-[#FFD000]">View All →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {stores.filter((s) => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((store) => (
              <Link key={store.id} href={`/site/${store.id}/shop`} className="bg-white rounded-2xl border border-gray-100 shadow-sm min-w-[160px] max-w-[160px] overflow-hidden active:scale-[0.97] transition-transform">
                <div className="h-20 bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-indigo-300" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-black text-[#2D2D2D] truncate">{store.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                    <p className="text-[9px] text-gray-400 truncate">{store.address || "No address"}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-bold text-[#FFE11B] bg-[#FFE11B]/10 px-1.5 py-0.5 rounded">{store.orderCount} orders</span>
                    <span className="text-[9px] font-bold text-[#2D2D2D]">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-[#2D2D2D]">Recent Orders</h2>
            <Link href="/customer/orders" className="text-[10px] font-bold text-[#FFE11B] hover:text-[#FFD000]">View All →</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.slice(0, 4).map((order) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;
              const isChanged = changedOrderIds.has(order.id);
              return (
                <div key={order.id} className={`bg-white rounded-2xl border p-3.5 flex items-center gap-3 shadow-sm transition-all ${isChanged ? `${config.border} border-2 shadow-md animate-slide-up` : "border-gray-100"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-[#2D2D2D] truncate">{order.tenant.name}</p>
                      <p className="text-xs font-black text-[#2D2D2D]">₹{order.netAmount.toFixed(0)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[9px] text-gray-400 truncate">
                        {order.items.slice(0, 2).map((i) => i.name).join(", ")}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalOrders === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mt-4">
          <div className="w-16 h-16 bg-[#FFE11B]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8 text-[#FFE11B]" />
          </div>
          <p className="text-sm font-black text-[#2D2D2D]">No orders yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Browse a store to place your first order</p>
          <Link href="/customer/stores" className="inline-flex items-center gap-2 bg-[#FFE11B] text-[#2D2D2D] px-5 py-2.5 rounded-xl text-xs font-black hover:bg-[#FFD000] transition-colors shadow-sm">
            <Store className="w-4 h-4" /> Browse Stores
          </Link>
        </div>
      )}
    </div>
  );
}
