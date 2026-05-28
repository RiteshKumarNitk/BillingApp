import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          transactions: true
        }
      }
    }
  });

  if (!tenant) {
    notFound();
  }

  const t = tenant as any;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Details</h1>
        <div className="flex gap-2">
          <Link 
            href={`/tenants/${tenantId}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Edit
          </Link>
          <Link 
            href="/tenants" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Business Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.email || '-'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.contactPerson || '-'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.phone || '-'}</dd>
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
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {t.subscriptionPlan}
              </span>
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.gstin || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.address || '-'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.createdAt.toLocaleDateString()}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">{t.updatedAt.toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{tenant._count.users}</div>
            <div className="text-sm text-gray-500">Users</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{tenant._count.products}</div>
            <div className="text-sm text-gray-500">Products</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{tenant._count.transactions}</div>
            <div className="text-sm text-gray-500">Transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
