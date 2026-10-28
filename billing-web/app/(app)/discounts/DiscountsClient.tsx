"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Ticket, Sparkles, X } from 'lucide-react';
import { createDiscount, updateDiscount, setDiscountActive, deleteDiscount, type DiscountInput } from '@/lib/actions/discounts';
import { useToast } from '@/components/ui/Toast';

export interface DiscountRow {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  discountPercentage: number;
  applicableCategory: string | null;
  minimumQuantity: number;
  startDay: string;
  endDay: string;
  isActive: boolean;
  state: 'live' | 'scheduled' | 'expired' | 'off';
}

const STATE_STYLE: Record<DiscountRow['state'], string> = {
  live: 'bg-emerald-50 text-emerald-700',
  scheduled: 'bg-sky-50 text-sky-700',
  expired: 'bg-gray-100 text-gray-500',
  off: 'bg-gray-100 text-gray-500',
};

type FormState = { kind: 'coupon' | 'automatic' } & Required<Omit<DiscountInput, 'isActive' | 'discountPercentage' | 'minimumQuantity'>> & { discountPercentage: string; minimumQuantity: string };

const emptyForm = (): FormState => ({ kind: 'coupon', name: '', description: '', code: '', discountPercentage: '', applicableCategory: '', minimumQuantity: '1', startDate: '', endDate: '' });

export default function DiscountsClient({ discounts, categories }: { discounts: DiscountRow[]; categories: string[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const startCreate = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };
  const startEdit = (d: DiscountRow) => {
    setEditingId(d.id);
    setForm({
      kind: d.code ? 'coupon' : 'automatic', name: d.name, description: d.description || '', code: d.code || '',
      discountPercentage: String(d.discountPercentage), applicableCategory: d.applicableCategory || '',
      minimumQuantity: String(d.minimumQuantity), startDate: d.startDay, endDate: d.endDay,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: DiscountInput = {
      name: form.name, description: form.description,
      code: form.kind === 'coupon' ? form.code : null,
      discountPercentage: form.discountPercentage, applicableCategory: form.applicableCategory || null,
      minimumQuantity: form.minimumQuantity, startDate: form.startDate || null, endDate: form.endDate || null,
    };
    try {
      const result = editingId ? await updateDiscount(editingId, payload) : await createDiscount(payload);
      if (!result.ok) {
        addToast('error', result.error);
        return;
      }
      addToast('success', editingId ? 'Discount updated' : 'Discount created');
      setOpen(false);
      router.refresh();
    } catch {
      addToast('error', 'Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (d: DiscountRow) => {
    setBusyId(d.id);
    try {
      const result = await setDiscountActive(d.id, !d.isActive);
      if (!result.ok) addToast('error', result.error);
      else router.refresh();
    } catch {
      addToast('error', 'Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: DiscountRow) => {
    if (!confirm(`Delete "${d.name}"? Past sales that used it are not affected.`)) return;
    setBusyId(d.id);
    try {
      const result = await deleteDiscount(d.id);
      if (!result.ok) {
        addToast('error', result.error);
        return;
      }
      addToast('success', 'Discount deleted');
      router.refresh();
    } catch {
      addToast('error', 'Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New discount
        </button>
      </div>

      {discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-gray-400 shadow-sm">
          <Ticket className="mb-2 h-10 w-10" />
          <p className="text-sm">No discounts yet. Create a coupon code or an automatic offer.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Applies to</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{d.name} <span className="font-normal text-indigo-600">· {d.discountPercentage}% off</span></p>
                    {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {d.code
                      ? <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold text-amber-800"><Ticket className="h-3 w-3" />{d.code}</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Sparkles className="h-3 w-3 text-indigo-500" />Automatic (online)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.applicableCategory || 'Whole order'}
                    {d.minimumQuantity > 1 && <span className="text-xs text-gray-400"> · min {d.minimumQuantity} items</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{d.startDay || d.endDay ? `${d.startDay || '…'} → ${d.endDay || '…'}` : 'Always'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(d)} disabled={busyId === d.id} title={d.isActive ? 'Click to switch off' : 'Click to switch on'}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize disabled:opacity-50 ${STATE_STYLE[d.state]}`}>
                      {d.state === 'off' ? 'Off' : d.state}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => startEdit(d)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label={`Edit ${d.name}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(d)} disabled={busyId === d.id} className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label={`Delete ${d.name}`}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={save} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-700" aria-label="Close"><X className="h-5 w-5" /></button>
            <h2 className="mb-4 text-lg font-bold text-gray-900">{editingId ? 'Edit discount' : 'New discount'}</h2>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['coupon', 'automatic'] as const).map((k) => (
                <button key={k} type="button" onClick={() => setForm({ ...form, kind: k })}
                  className={`rounded-xl border p-3 text-left text-sm ${form.kind === k ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <p className="font-semibold text-gray-900">{k === 'coupon' ? 'Coupon code' : 'Automatic offer'}</p>
                  <p className="text-xs text-gray-500">{k === 'coupon' ? 'Cashier enters a code at billing' : 'Applies to online & QR orders'}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className={label}>Name</label><input className={input} required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Diwali offer" /></div>
              {form.kind === 'coupon' && (
                <div className="col-span-2"><label className={label}>Code</label><input className={`${input} font-mono uppercase`} required pattern="[A-Za-z0-9_\-]{3,30}" title="3–30 letters, digits, - or _" value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DIWALI10" /></div>
              )}
              <div><label className={label}>Discount %</label><input className={input} type="number" min="0.01" max="100" step="0.01" required value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} /></div>
              <div><label className={label}>Min. items</label><input className={input} type="number" min="1" max="1000" step="1" value={form.minimumQuantity} onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })} /></div>
              <div className="col-span-2"><label className={label}>Applies to</label>
                <select className={input} value={form.applicableCategory ?? ''} onChange={(e) => setForm({ ...form, applicableCategory: e.target.value })}>
                  <option value="">Whole order</option>
                  {categories.map((c) => <option key={c} value={c}>Category: {c}</option>)}
                </select>
              </div>
              <div><label className={label}>Starts (optional)</label><input className={input} type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className={label}>Ends (optional)</label><input className={input} type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div className="col-span-2"><label className={label}>Note (optional)</label><input className={input} maxLength={300} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
