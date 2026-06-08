"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Store, User, Bell, MapPin, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/customer", label: "Home", icon: Home },
  { href: "/customer/stores", label: "Stores", icon: Store },
  { href: "/customer/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customer/notifications", label: "Alerts", icon: Bell },
  { href: "/customer/profile", label: "Profile", icon: User },
];

// Bottom tab bar - Zepto style
export function CustomerBottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/customer/notifications?unreadOnly=true")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unreadCount || 0))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/customer/notifications?unreadOnly=true")
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.unreadCount || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[60px] px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/customer" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const isNotifications = item.href === "/customer/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] transition-all ${
                isActive ? "text-[#FFE11B]" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-transform ${isActive ? "scale-110" : ""}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[7px] font-black min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#2D2D2D] font-black" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-[#FFE11B] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Top header bar - Zepto style with location
export function CustomerTopBar() {
  const [name, setName] = useState("Customer");

  useEffect(() => {
    fetch("/api/customer/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.user?.name) setName(d.user.name); })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-[#FFE11B] sticky top-0 z-40 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2D2D2D] rounded-xl flex items-center justify-center">
              <span className="text-[#FFE11B] text-xs font-black">BA</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-[#2D2D2D] leading-tight">BillingApp</h1>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#2D2D2D]/60" />
                <span className="text-[10px] font-semibold text-[#2D2D2D]/60">Your Location</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/customer/auth/login" })}
            className="p-2 text-[#2D2D2D]/40 hover:text-[#2D2D2D] hover:bg-white/30 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
