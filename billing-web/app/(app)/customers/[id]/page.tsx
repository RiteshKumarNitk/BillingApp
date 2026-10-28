import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Star, Receipt } from 'lucide-react';
import { getCustomerDetail } from '@/lib/customers';
import CustomerPhotoUpload from './CustomerPhotoUpload';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const detail = await getCustomerDetail(session.user.tenantId, id);
  if (!detail) notFound();

  const { customer, transactions } = detail;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          {customer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customer.photoUrl} alt={customer.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
              {customer.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              {customer.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>}
              {customer.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {customer.email}</span>}
              {customer.address && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {customer.address}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Spent</p>
            <p className="mt-1 text-lg font-bold text-gray-900">₹{customer.totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Orders</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Loyalty Points</p>
            <p className="mt-1 text-lg font-bold text-gray-900 inline-flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {customer.loyaltyPoints}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Last Visit</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
            </p>
          </div>
        </div>

        <CustomerPhotoUpload customerId={customer.id} currentPhotoUrl={customer.photoUrl} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Order History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">No completed orders yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/billing/${tx.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.items.slice(0, 2).map((i) => i.name).join(', ')}{tx.items.length > 2 ? ` +${tx.items.length - 2} more` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{tx.netAmount.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
