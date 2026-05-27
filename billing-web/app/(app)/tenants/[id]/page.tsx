import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, Phone, Calendar, User, CreditCard, Users as UsersIcon, Edit, ShieldAlert, ShieldCheck } from "lucide-react";
import TenantStatusToggle from "./TenantStatusToggle";

export default async function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'SUPERADMIN') {
    redirect("/dashboard");
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: {
        include: { tenantRole: true }
      },
      _count: {
        select: { products: true, transactions: true }
      }
    }
  });

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold text-gray-800">Tenant not found</h2>
        <Link href="/tenants" className="text-indigo-600 mt-2 hover:underline">Return to Tenants List</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/tenants" 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                tenant.status === 'ACTIVE' 
                  ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                  : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
              }`}>
                {tenant.status === 'ACTIVE' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                {tenant.status}
              </span>
              • Created {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TenantStatusToggle tenantId={tenant.id} currentStatus={tenant.status} />
          <Link 
            href={`/tenants/${tenant.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Tenant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Business & Admin Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm font-medium text-gray-500">Domain</p>
                <p className="mt-1 text-sm text-gray-900">{tenant.domain}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">GSTIN</p>
                <p className="mt-1 text-sm text-gray-900">{tenant.gstin || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="mt-1 text-sm text-gray-900">{tenant.address || 'No address provided'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Primary Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Person</p>
                <p className="mt-1 text-sm text-gray-900">{tenant.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {tenant.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {tenant.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-500" />
                Team Members ({tenant.users.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenant.users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                          {user.tenantRole?.name || 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email} {user.phone && <span className="block text-xs mt-0.5 text-gray-400">{user.phone}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Subscription */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Subscription
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                {tenant.subscriptionPlan}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">To change the subscription plan, edit the tenant details.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Usage</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{tenant._count.products}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">P</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{tenant._count.transactions}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">T</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
