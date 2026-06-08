"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, Check, CheckCheck, Clock, CheckCircle, XCircle,
  ShoppingBag, Loader2
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  orderId: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  ORDER_APPROVED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ORDER_REJECTED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ORDER_PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ORDER_STATUS: { icon: ShoppingBag, color: "text-indigo-600", bg: "bg-indigo-50" },
  GENERAL: { icon: Bell, color: "text-gray-600", bg: "bg-gray-50" },
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function CustomerNotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const url = filter === "unread" ? "/api/customer/notifications?unreadOnly=true" : "/api/customer/notifications";
      const res = await fetch(url);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      fetchNotifications();
    }
    setMarkingAll(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You&apos;re all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
            filter === "unread" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "unread"
              ? "All notifications have been read"
              : "You&apos;ll be notified when stores respond to your orders"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.GENERAL;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all cursor-pointer hover:shadow-md ${
                  notif.isRead ? "border-gray-100" : "border-indigo-200 bg-indigo-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-semibold ${notif.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${notif.isRead ? "text-gray-400" : "text-gray-600"}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                      {notif.orderId && (
                        <span className="text-[10px] font-mono text-gray-400">
                          Order #{notif.orderId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
