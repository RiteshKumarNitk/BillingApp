import Link from 'next/link';
import { Download, Scale } from 'lucide-react';
import { getProfitAndLoss } from '@/lib/analytics';
import { getTenantTimeZone, monthRangeInTz } from '@/lib/tenantTime';
import { expenseCategoryLabel } from '@/lib/expenseCategories';

const inr = (n: number) => `${n < 0 ? '−' : ''}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// One statement line. Module-level (not defined inside the render) so React keeps it stable.
function Row({ label, value, strong, muted, indent }: { label: string; value: number; strong?: boolean; muted?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${strong ? 'font-bold text-gray-900' : muted ? 'text-gray-500' : 'text-gray-700'} ${indent ? 'pl-4 text-sm' : ''}`}>
      <span>{label}</span>
      <span className={strong && value < 0 ? 'text-rose-600' : ''}>{inr(value)}</span>
    </div>
  );
}

// Monthly Profit & Loss statement for the Reports page. The caller must already have checked
// VIEW_PROFIT — this renders cost and profit figures.
export default async function ProfitLossSection({ tenantId, monthKey }: { tenantId: string; monthKey?: string }) {
  const range = monthRangeInTz(monthKey, await getTenantTimeZone(tenantId));
  const pl = await getProfitAndLoss(tenantId, range.start, range.end);

  return (
    <section id="profit-and-loss" className="mb-8 rounded-2xl border border-gray-100 bg-white/50 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Scale className="h-5 w-5 text-indigo-500" /> Profit &amp; Loss
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/reports?pl=${range.prevKey}#profit-and-loss`} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">←</Link>
          <span className="min-w-32 text-center font-semibold text-gray-800">{range.label}</span>
          {range.isCurrentMonth
            ? <span className="rounded-lg border border-gray-100 px-3 py-1.5 text-gray-300">→</span>
            : <Link href={`/reports?pl=${range.nextKey}#profit-and-loss`} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">→</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="divide-y divide-gray-100">
          <Row label={`Billed (${pl.salesCount} sales)`} value={pl.grossBilled} />
          <Row label="Less: GST collected" value={-pl.taxCollected} muted />
          <Row label="Net sales" value={pl.netSales} strong />
          <Row label="Less: cost of goods sold" value={-pl.costOfGoods} muted />
          <Row label={`Gross profit (${pl.grossMarginPercent}% margin)`} value={pl.grossProfit} strong />
          {pl.expenses.map((e) => <Row key={e.category} label={expenseCategoryLabel(e.category)} value={-e.total} muted indent />)}
          <Row label="Less: total expenses" value={-pl.totalExpenses} muted />
          <Row label={`Net profit (${pl.netMarginPercent}% margin)`} value={pl.netProfit} strong />
        </div>
        <div className="space-y-3 text-sm text-gray-500">
          <p>Cost of goods uses each product&apos;s purchase price at the time of sale. Products without a purchase price count as zero cost, which overstates profit.</p>
          <p>Expenses are whatever has been recorded on the <Link href={`/expenses?month=${range.key}`} className="font-medium text-indigo-600 hover:text-indigo-800">Expenses</Link> page for this month.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={`/api/export/sales?month=${range.key}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" /> Sales CSV</a>
            <a href={`/api/export/gst?month=${range.key}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" /> GST CSV</a>
            <a href={`/api/export/expenses?month=${range.key}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"><Download className="h-4 w-4" /> Expenses CSV</a>
          </div>
        </div>
      </div>
    </section>
  );
}
