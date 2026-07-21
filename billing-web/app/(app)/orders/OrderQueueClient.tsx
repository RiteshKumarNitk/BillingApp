"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, XCircle, Clock, ShoppingCart, User, Phone, PauseCircle, ChefHat, RefreshCw } from "lucide-react";

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
  notes: string | null;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  customerAccount: { name: string; email: string; phone: string | null } | null;
  guestName: string | null;
  guestPhone: string | null;
  table: { label: string } | null;
  orderType: string | null;
  items: OrderItem[];
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-blue-100 text-blue-700",
  READY: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

// New PENDING orders should surface without a manual refresh — polling is the pragmatic choice
// here since there's no websocket/SSE layer anywhere else in this codebase to build on.
const POLL_INTERVAL_MS = 15000;

export default function OrderQueueClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchOrders = useCallback(async (status: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/tenant/orders?status=${status}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setStatusCounts(data.statusCounts || {});
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    const interval = setInterval(() => fetchOrders(activeTabRef.current, true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAction = async (orderId: string, action: "ACCEPT" | "HOLD" | "REJECT") => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/tenant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        fetchOrders(activeTab, true);
      }
    } catch (error) {
      console.error("Failed to process order:", error);
    }
    setProcessingId(null);
  };

  const tabs = [
    { key: "PENDING", label: "Pending", icon: Clock },
    { key: "ON_HOLD", label: "On Hold", icon: PauseCircle },
    { key: "ACCEPTED", label: "Accepted", icon: ChefHat },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle },
    { key: "REJECTED", label: "Rejected", icon: XCircle },
  ];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage online orders from customers</p>
        </div>
        <button
          onClick={() => fetchOrders(activeTab)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {statusCounts[tab.key] ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {statusCounts[tab.key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No {activeTab.toLowerCase().replace('_', ' ')} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {order.customerAccount?.name || order.guestName || "Guest"}
                      {!order.customerAccount && order.guestName && (
                        <span className="ml-1 text-[10px] font-semibold text-gray-400 uppercase">Guest</span>
                      )}
                    </span>
                    {(order.customerAccount?.phone || order.guestPhone) && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerAccount?.phone || order.guestPhone}
                      </span>
                    )}
                    {order.table && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                        {order.table.label}
                      </span>
                    )}
                    {order.orderType && order.orderType !== 'DINE_IN' && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {order.orderType.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">₹{order.netAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900">₹{item.itemTotal.toFixed(2)}</span>
                  </div>
                ))}
                {order.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Note: {order.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              {order.status === "PENDING" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(order.id, "ACCEPT")}
                    disabled={processingId === order.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(order.id, "HOLD")}
                    disabled={processingId === order.id}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-all"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Hold
                  </button>
                  <button
                    onClick={() => handleAction(order.id, "REJECT")}
                    disabled={processingId === order.id}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
              {order.status === "ON_HOLD" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(order.id, "ACCEPT")}
                    disabled={processingId === order.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(order.id, "REJECT")}
                    disabled={processingId === order.id}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
              {order.status === "ACCEPTED" && (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5" /> In the Kitchen Queue — track prep &amp; completion from there.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
