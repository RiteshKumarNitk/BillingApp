"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users,
  Building,
  Settings,
  Shield
} from 'lucide-react';

export default function Sidebar({ user, tenant }: { user: any, tenant: any }) {
  const pathname = usePathname();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const hasManageUsers = user?.permissions?.includes('MANAGE_USERS');

  let navLinks: { name: string, href: string, icon: any }[] = [];

  if (isSuperAdmin) {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Manage Tenants', href: '/tenants', icon: Building },
      { name: 'Global Users', href: '/users', icon: Users },
      { name: 'Platform Settings', href: '/settings', icon: Settings }
    ];
  } else {
    navLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Billing', href: '/billing', icon: Receipt },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Bulk Inventory', href: '/inventory', icon: Package },
      { name: 'Digital Menu QR', href: '/settings/menu', icon: Package },
    ];
    
    if (hasManageUsers) {
      navLinks.push({ name: 'Team Members', href: '/users', icon: Users });
      navLinks.push({ name: 'Roles', href: '/roles', icon: Shield });
    }
    
    navLinks.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col hidden md:flex">
      {/* Tenant Branding */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {tenant?.name?.charAt(0) || 'S'}
          </div>
          <span className="font-semibold text-gray-900 truncate">
            {isSuperAdmin ? 'Superadmin System' : tenant?.name}
          </span>
        </div>
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
    </aside>
  );
}
