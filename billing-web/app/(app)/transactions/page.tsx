import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Receipt, Search, Calendar } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    redirect('/dashboard');
  }

  const tenantId = session.user.tenantId;
  const page = Math.max(1, parseInt((searchParams?.page as string) || '1', 10));
  const query = (searchParams?.q as string) || '';
  const dateFrom = (searchParams?.from as string) || '';
  const dateTo = (searchParams?.to as string) || '';

  const where: any = { tenantId };

  if (query) {
    where.id = { startsWith: query, mode: 'insensitive' };
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = startOfDay(parseISO(dateFrom));
    if (dateTo) where.createdAt.lte = endOfDay(parseISO(dateTo));
  }

  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
      include: {
        user: true,
        _count: { select: { items: true } }
      }
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">{total} total bills found</p>
        </div>
      </div>

      {/* Filters */}
      <form className="mb-6 flex flex-col sm:flex-row gap-3" method="GET">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by bill number..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            name="from"
            defaultValue={dateFrom}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            name="to"
            defaultValue={dateTo}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
        {(query || dateFrom || dateTo) && (
          <Link
            href="/transactions"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/transactions?page=${page - 1}${query ? `&q=${query}` : ''}${dateFrom ? `&from=${dateFrom}` : ''}${dateTo ? `&to=${dateTo}` : ''}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/transactions?page=${page + 1}${query ? `&q=${query}` : ''}${dateFrom ? `&from=${dateFrom}` : ''}${dateTo ? `&to=${dateTo}` : ''}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
