import Link from 'next/link';
import prisma from '@/lib/prisma';

type TenantRow = {
  id: string;
  name: string;
  createdAt: string | Date;
  status: string;
};
import { format } from 'date-fns';
import { 
  Building,
  Users,
  Activity,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default async function SuperAdminDashboard() {
  // 1. Fetch Stats
  const totalTenants = await prisma.tenant.count({
    where: { name: { not: 'System Administration' } }
  });
  
  const activeTenants = await prisma.tenant.count({
    where: { 
      name: { not: 'System Administration' },
      status: 'ACTIVE'
    }
  });

  const totalUsers = await prisma.user.count({
    where: { role: { not: 'SUPERADMIN' } }
  });

  // 2. Fetch Recent Tenants
  const recentTenants = await prisma.tenant.findMany({
    take: 5,
    where: { name: { not: 'System Administration' } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Platform Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of all SaaS tenants and system health</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/tenants" 
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Building className="h-4 w-4" />
              Manage Tenants
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Total Registered Tenants" 
            value={totalTenants.toString()}
            icon={<Building className="h-6 w-6 text-indigo-600" />}
            gradient="from-indigo-500/20 to-indigo-500/5"
          />
          <StatCard 
            title="Active Tenants" 
            value={activeTenants.toString()}
            icon={<Activity className="h-6 w-6 text-emerald-600" />}
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
          <StatCard 
            title="Global Users" 
            value={totalUsers.toString()}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            gradient="from-blue-500/20 to-blue-500/5"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Tenants List */}
          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Recent Tenants</h2>
              <Link href="/tenants" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentTenants.map((tenant: TenantRow) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(tenant.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${tenant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                        `}>
                          {tenant.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentTenants.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                        No tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Health / Alerts */}
          <section className="rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Platform Health</h2>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-emerald-900">All Systems Operational</h3>
              <p className="mt-2 text-emerald-700 text-sm">
                The database and API endpoints are performing optimally. No alerts to display.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100/50">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
        </div>
      </div>
    </div>
  );
}
