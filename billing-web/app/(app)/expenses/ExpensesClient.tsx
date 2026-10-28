"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Wallet, Download } from 'lucide-react';
import { createExpense, deleteExpense } from '@/lib/actions/expenses';
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from '@/lib/expenseCategories';
import { useToast } from '@/components/ui/Toast';

interface ExpenseRow { id: string; name: string; category: string; amount: number; date: string; notes: string | null }

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const todayKey = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the browser's zone

export default function ExpensesClient({ monthKey, isCurrentMonth, expenses, byCategory, total }: {
  monthKey: string;
  isCurrentMonth: boolean;
  expenses: ExpenseRow[];
  byCategory: { category: string; total: number }[];
  total: number;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  // Default the date to today in the current month, otherwise the 1st of the month being viewed.
  const [form, setForm] = useState({ name: '', category: 'SUPPLIES', amount: '', date: isCurrentMonth ? todayKey() : `${monthKey}-01`, notes: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await createExpense({ ...form, amount: form.amount });
      if (!result.ok) {
        addToast('error', result.error);
        return;
      }
      setForm((f) => ({ ...f, name: '', amount: '', notes: '' }));
      addToast('success', 'Expense added');
      router.refresh();
    } catch {
      addToast('error', 'Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ExpenseRow) => {
    if (!confirm(`Delete "${row.name}" (${inr(row.amount)})?`)) return;
    setDeletingId(row.id);
    try {
      const result = await deleteExpense(row.id);
      if (!result.ok) {
        addToast('error', result.error);
        return;
      }
      addToast('success', 'Expense deleted');
      router.refresh();
    } catch {
      addToast('error', 'Could not reach the server. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Add expense</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className={`${input} lg:col-span-2`} placeholder="Description (e.g. Milk — Nandini)" maxLength={120} required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{expenseCategoryLabel(c)}</option>)}
          </select>
          <input className={input} type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="Amount (₹)" required
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input className={input} type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input className={`${input} sm:col-span-2 lg:col-span-4`} placeholder="Notes (optional)" maxLength={500}
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            <Plus className="h-4 w-4" /> {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total this month</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{inr(total)}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {byCategory.length === 0 && <li className="text-gray-400">No expenses recorded.</li>}
            {[...byCategory].sort((a, b) => b.total - a.total).map((c) => (
              <li key={c.category} className="flex justify-between">
                <span className="text-gray-600">{expenseCategoryLabel(c.category)}</span>
                <span className="font-medium text-gray-900">{inr(c.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm">
            <Link href={`/reports?pl=${monthKey}#profit-and-loss`} className="font-medium text-indigo-600 hover:text-indigo-800">View Profit &amp; Loss →</Link>
            <a href={`/api/export/expenses?month=${monthKey}`} className="inline-flex items-center gap-1.5 font-medium text-gray-600 hover:text-gray-900">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Wallet className="mb-2 h-10 w-10" />
              <p className="text-sm">No expenses for this month yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-2 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {e.name}
                      {e.notes && <p className="text-xs text-gray-400">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{expenseCategoryLabel(e.category)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{inr(e.amount)}</td>
                    <td className="px-2 py-3 text-right">
                      <button onClick={() => handleDelete(e)} disabled={deletingId === e.id} aria-label={`Delete ${e.name}`}
                        className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
