import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { Building2, Mail, Phone, User, Plus, Eye, Pencil } from 'lucide-react';

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } }
  });

  return (
    <div>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} business{tenants.length !== 1 ? 'es' : ''} registered</p>
        </div>
        <Link
          href="/tenants/add"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Tenant
        </Link>
      </header>

      {tenants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tenants found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first tenant to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant: any) => (
            <div key={tenant.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-4">
                
                {/* Left: Icon + Info */}
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
                      <span>{tenant.subscriptionPlan}</span>
                      <span>•</span>
                      <span>Added {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                      : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                  }`}>
                    {tenant.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/tenants/${tenant.id}/edit`}
                      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}