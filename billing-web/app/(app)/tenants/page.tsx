import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tenants</h1>
        <Link href="/tenants/add" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Add New Tenant
        </Link>
      </header>

      {tenants.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No tenants found. Add your first tenant.</p>
      ) : (
        <div className="space-y-4">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                  <p className="text-sm text-gray-600">
                    Domain: {tenant.domain || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: 
                    <span className={`
                      ${tenant.status === 'ACTIVE' ? 'text-green-600' : 
                        tenant.status === 'INACTIVE' ? 'text-yellow-600' : 
                        'text-red-600'}
                    `}>
                      {tenant.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(tenant.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-x-2">
                  <Link 
                    href={`/tenants/${tenant.id}`} 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View
                  </Link>
                  <Link 
                    href={`/tenants/${tenant.id}/edit`} 
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}