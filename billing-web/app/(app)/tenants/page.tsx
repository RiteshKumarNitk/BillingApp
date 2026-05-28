import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { Building2, Mail, Phone, User, Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import StatusSelect from './StatusSelect';

const ITEMS_PER_PAGE = 20;

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/dashboard');

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || '1'));
  const search = sp.search || '';
  const statusFilter = sp.status || '';
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { domain: { contains: search, mode: 'insensitive' as const } },
    ];
  }
  if (statusFilter) where.status = statusFilter;

  let tenants: any[] = [];
  let total = 0;
  try {
    const result = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: ITEMS_PER_PAGE,
        include: { _count: { select: { users: true } } },
      }),
      prisma.tenant.count({ where }),
    ]);
    tenants = result[0];
    total = result[1];
  } catch (e) {
    console.error("Failed to fetch tenants:", e);
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const buildHref = (p: number, s?: string, st?: string) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (s || search) params.set('search', s || search);
    if (st || statusFilter) params.set('status', st || statusFilter);
    return `/tenants?${params}`;
  };

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{total} business{total !== 1 ? 'es' : ''} registered</p>
        </div>
        <Link
          href="/tenants/add"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Tenant
        </Link>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <form method="GET" action="/tenants" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, email, or domain..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 text-sm"
            />
          </div>
          <div className="relative">
            <StatusSelect defaultValue={statusFilter} />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
            Search
          </button>
          {(search || statusFilter) && (
            <Link
              href="/tenants"
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Link>
          )}
        </form>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tenants found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || statusFilter ? 'Try different search filters.' : 'Add your first tenant to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tenants.map((tenant: any) => (
              <div key={tenant.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base truncate">{tenant.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                        {tenant.email && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {tenant.email}
                          </span>
                        )}
                        {tenant.phone && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {tenant.phone}
                          </span>
                        )}
                        {tenant.contactPerson && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {tenant.contactPerson}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span>{tenant._count.users} user{tenant._count.users !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{tenant.subscriptionPlan}</span>
                        <span>•</span>
                        <span>Added {new Date(tenant.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                        : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    }`}>{tenant.status}</span>
                    <div className="flex items-center gap-2">
                      <Link href={`/tenants/${tenant.id}`} className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium">View</Link>
                      <span className="text-gray-300">|</span>
                      <Link href={`/tenants/${tenant.id}/edit`} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium">Edit</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link href={buildHref(page - 1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400">...</span>}
                      <Link
                        href={buildHref(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                          p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}
                {page < totalPages && (
                  <Link href={buildHref(page + 1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
