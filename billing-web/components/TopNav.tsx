"use client";

import { signOut } from "next-auth/react";
import { User, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/billing': 'Billing',
  '/transactions': 'Transactions',
  '/products': 'Products',
  '/inventory': 'Bulk Inventory',
  '/orders': 'Order Requests',
  '/barcodes': 'Barcode Labels',
  '/users': 'Users',
  '/roles': 'Roles',
  '/tenants': 'Tenants',
  '/settings': 'Settings',
  '/settings/menu': 'Digital Menu QR',
  '/roles': 'Roles',
};

export default function TopNav({ user }: { user: any }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toggleMobile } = useSidebar();
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // Determine page title from pathname
  const pageTitle = pageTitles[pathname] ||
    (pathname.startsWith('/tenants/') ? 'Tenant Details' :
     pathname.startsWith('/products/') ? 'Product Details' :
     pathname.startsWith('/billing/') ? 'Invoice' : '');

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        {pageTitle && (
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-sm text-left hidden sm:block">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 animate-slide-up" role="menu">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{user?.role}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
