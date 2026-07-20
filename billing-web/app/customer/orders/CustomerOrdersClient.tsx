"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, ShoppingBag, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  itemTotal: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  tenantId: string;
  tenant: { name: string };
  items: OrderItem[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  APPROVED: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Approved" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Completed" },
  REJECTED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Rejected" },
};

const tabs = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
];

export default function CustomerOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);
  const tabCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-xl font-black text-[#2D2D2D] mb-1">My Orders</h1>
      <p className="text-xs text-gray-500 mb-4">Track all your order requests</p>

      {/* Status Tabs - Zepto style */}
      <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === tab.key
                ? "bg-white text-[#2D2D2D] shadow-sm"
                : "text-gray-500"
            }`}
          >
            {tab.label}
            {tab.key !== "ALL" && tabCounts[tab.key] ? (
              <span className="ml-1 text-[9px] opacity-50">({tabCounts[tab.key]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-[#FFE11B] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#2D2D2D]">No orders yet</p>
          <p className="text-xs text-gray-400 mt-1">Scan a store QR to start ordering</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            const Icon = config.icon;
            const isExpanded = expandedOrder === order.id;
            return (
              <div key={order.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isExpanded ? config.border : "border-gray-100"}`}>
                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full p-3.5 text-left hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#2D2D2D]">{order.tenant.name}</p>
                        <p className="text-[9px] text-gray-400 font-mono">#{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black text-[#2D2D2D]">₹{order.netAmount.toFixed(2)}</p>
                        <p className="text-[9px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[9px] text-gray-400">{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 p-3.5 space-y-3 animate-slide-up">
                    <div className="bg-gray-50 rounded-xl p-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5">
                          <div>
                            <p className="text-xs font-semibold text-[#2D2D2D]">{item.name}</p>
                            <p className="text-[9px] text-gray-400">₹{item.salePrice.toFixed(2)} × {item.quantity}</p>
                          </div>
                          <p className="text-xs font-bold text-[#2D2D2D]">₹{item.itemTotal.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.totalAmount.toFixed(2)}</span></div>
                      {order.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>₹{order.taxAmount.toFixed(2)}</span></div>}
                      <div className="flex justify-between font-black text-[#2D2D2D] pt-1 border-t border-gray-100"><span>Total</span><span>₹{order.netAmount.toFixed(2)}</span></div>
                    </div>
                    <a href={`/site/${order.tenantId}/shop`} className="block w-full text-center py-2.5 bg-[#FFE11B] text-[#2D2D2D] text-xs font-black rounded-xl hover:bg-[#FFD000] transition-colors">
                      Reorder from {order.tenant.name}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
