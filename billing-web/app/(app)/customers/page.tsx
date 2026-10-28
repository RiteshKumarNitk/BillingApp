import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Star } from 'lucide-react';
import { listCustomers } from '@/lib/customers';

const ITEMS_PER_PAGE = 25;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    redirect('/dashboard');
  }

  const tenantId = session.user.tenantId;
  // searchParams is a Promise in Next 15+; reading it synchronously returned undefined, so search,
  // pagination and the dashboard's "new this month" filter were silently ignored.
  const sp = await searchParams;
  const page = Math.max(1, parseInt((sp?.page as string) || '1', 10));
  const query = (sp?.q as string) || '';
  const createdFrom = (sp?.from as string) || '';

  const { customers, total } = await listCustomers({ tenantId, search: query, page, pageSize: ITEMS_PER_PAGE, createdFrom: createdFrom || undefined });
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} customer{total === 1 ? '' : 's'} {createdFrom ? 'joined since ' + createdFrom : 'on file'}
          </p>
        </div>
      </div>

      <form className="mb-6 flex flex-col sm:flex-row gap-3" method="GET">
        {createdFrom && <input type="hidden" name="from" value={createdFrom} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
        {(query || createdFrom) && (
          <Link
            href="/customers"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="hidden sm:table-cell px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Loyalty Points</th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-sm text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                      <Link href={`/customers/${c.id}`} className="hover:text-indigo-600">{c.name}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-sm text-gray-500">{c.phone || '—'}</td>
                    <td className="hidden sm:table-cell whitespace-nowrap px-4 sm:px-6 py-4 text-center text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {c.loyaltyPoints}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-right text-sm font-bold text-gray-900">₹{c.totalSpent.toFixed(2)}</td>
                    <td className="hidden md:table-cell whitespace-nowrap px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} total)</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}${query ? `&q=${query}` : ''}${createdFrom ? `&from=${createdFrom}` : ''}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/customers?page=${page + 1}${query ? `&q=${query}` : ''}${createdFrom ? `&from=${createdFrom}` : ''}`}
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
