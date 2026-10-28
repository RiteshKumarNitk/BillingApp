import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { hasPermission } from '@/lib/permissions';
import { listExpenses } from '@/lib/actions/expenses';
import { getTenantTimeZone, monthRangeInTz } from '@/lib/tenantTime';
import ExpensesClient from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || session.user.role === 'SUPERADMIN') redirect('/dashboard');

  if (!(await hasPermission('VIEW_PROFIT'))) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>Expenses need the View Profit permission.</p>
        </div>
      </div>
    );
  }

  const { month } = await searchParams;
  const range = monthRangeInTz(month, await getTenantTimeZone(session.user.tenantId));
  const { expenses, byCategory, total } = await listExpenses({ from: range.start.toISOString(), to: range.end.toISOString() });

  return (
    <div className="font-sans mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">Rent, salaries, supplies and other running costs — used to calculate net profit.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/expenses?month=${range.prevKey}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50">← Prev</Link>
          <span className="min-w-36 text-center font-semibold text-gray-800">{range.label}</span>
          {range.isCurrentMonth ? (
            <span className="rounded-lg border border-gray-100 px-3 py-2 text-gray-300">Next →</span>
          ) : (
            <Link href={`/expenses?month=${range.nextKey}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50">Next →</Link>
          )}
        </div>
      </header>

      <ExpensesClient
        monthKey={range.key}
        isCurrentMonth={range.isCurrentMonth}
        expenses={expenses.map((e) => ({ id: e.id, name: e.name, category: e.category, amount: e.amount, date: e.date.toISOString(), notes: e.notes }))}
        byCategory={byCategory}
        total={total}
      />
    </div>
  );
}
