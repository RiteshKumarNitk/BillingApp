"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users,
  Building,
  Settings,
  Shield,
  Tag,
  History,
  X,
  ClipboardList,
  Ruler
} from 'lucide-react';

export default function Sidebar({ user, tenant }: { user: any, tenant: any }) {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useSidebar();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const hasManageUsers = user?.permissions?.includes('MANAGE_USERS');

  let navLinks: { name: string, href: string, icon: any }[] = [];

  if (isSuperAdmin) {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Manage Tenants', href: '/tenants', icon: Building },
      { name: 'Subscription Plans', href: '/admin/plans', icon: ClipboardList },
      { name: 'Discount Coupons', href: '/admin/coupons', icon: Tag },
      { name: 'System Audit Logs', href: '/admin/audit-logs', icon: History },
      { name: 'Global Users', href: '/users', icon: Users },
      { name: 'Platform Settings', href: '/settings', icon: Settings }
    ];
  } else {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Billing', href: '/billing', icon: Receipt },
      { name: 'Transactions', href: '/transactions', icon: History },
      { name: 'Order Requests', href: '/orders', icon: ClipboardList },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Base Units', href: '/products/units', icon: Ruler },
      { name: 'Bulk Inventory', href: '/inventory', icon: Package },
      { name: 'Barcode Labels', href: '/barcodes', icon: Tag },
      { name: 'Digital Menu QR', href: '/settings/menu', icon: Package },
    ];
    
    if (hasManageUsers) {
      navLinks.push({ name: 'Team Members', href: '/users', icon: Users });
      navLinks.push({ name: 'Roles', href: '/roles', icon: Shield });
    }
    
    navLinks.push({ name: 'Billing & Subscriptions', href: '/settings/billing', icon: Receipt });
    navLinks.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  const sidebarContent = (
    <>
      {/* Tenant Branding */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {tenant?.name?.charAt(0) || 'S'}
          </div>
          <span className="font-semibold text-gray-900 truncate">
            {isSuperAdmin ? 'Superadmin System' : tenant?.name}
          </span>
        </div>
        {/* Close button on mobile */}
        <button onClick={closeMobile} className="md:hidden p-1 text-gray-400 hover:text-gray-600" aria-label="Close sidebar">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMobile}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 h-full flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeMobile}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-slide-in-left transition-opacity">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
