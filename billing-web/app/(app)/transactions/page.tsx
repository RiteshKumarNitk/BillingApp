import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { format } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Receipt } from 'lucide-react';

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    redirect('/dashboard');
  }

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      _count: { select: { items: true } }
    }
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">A complete history of all bills and invoices.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill No.</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {tx.id.substring(0, 8).toUpperCase()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {format(new Date(tx.createdAt), 'MMM dd, yyyy h:mm a')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {tx.user?.name || 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                  {tx._count.items}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                  ₹{tx.netAmount.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                  `}>
                    {tx.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link 
                    href={`/billing/${tx.id}`} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    <Receipt className="w-4 h-4" />
                    Invoice
                  </Link>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  No transactions found. Start billing to see history!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
