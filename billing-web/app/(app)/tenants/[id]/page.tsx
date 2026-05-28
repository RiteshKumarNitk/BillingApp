import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Details</h1>
        <Link 
          href="/tenants" 
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Back to Tenants
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Business Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Domain</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.domain}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {tenant.status}
              </span>
            </dd>
          </div>
          {tenant.phone && (
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.phone}</dd>
            </div>
          )}
          {tenant.gstin && (
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.gstin}</dd>
            </div>
          )}
          {tenant.address && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{tenant.address}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
