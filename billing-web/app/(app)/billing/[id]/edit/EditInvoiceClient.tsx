"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchProducts } from '@/lib/actions/products';
import { ArrowLeft, Plus, Minus, Trash2, Search, X } from 'lucide-react';

interface EditableLine {
  cartId: string;
  productId: string;
  name: string;
  variantId: string | null;
  // M4: carried through the edit so a removed/reduced BATCH/SERIAL line is reconciled against the
  // right inventory row (batch stock / serial status), not the base product.
  batchId: string | null;
  serialId: string | null;
  productType: string | null;
  salePrice: number;
  quantity: number;
  // A product's current variants, so the editor can change which variant this line is — only
  // populated for VARIANT-type lines (fetched when the line is first shown, from `variants` on
  // the original TransactionItem's product if present, else via search results when re-added).
  availableVariants: { id: string; name: string; salePrice: number }[];
}

export default function EditInvoiceClient({ transaction }: { transaction: any }) {
  const router = useRouter();

  const [lines, setLines] = useState<EditableLine[]>(
    transaction.items.map((item: any) => ({
      cartId: item.id,
      productId: item.productId,
      name: item.name,
      variantId: item.variantId,
      batchId: item.batchId ?? null,
      serialId: item.serialId ?? null,
      productType: item.productType,
      salePrice: item.salePrice,
      quantity: item.quantity,
      availableVariants: [],
    }))
  );
  const [notes, setNotes] = useState(transaction.notes || '');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = lines.reduce((sum, l) => sum + l.salePrice * l.quantity, 0);

  const updateQuantity = (cartId: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.cartId === cartId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (cartId: string) => setLines((prev) => prev.filter((l) => l.cartId !== cartId));

  const changeVariant = (cartId: string, variantId: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.cartId !== cartId) return l;
        const variant = l.availableVariants.find((v) => v.id === variantId);
        if (!variant) return l;
        return { ...l, variantId: variant.id, salePrice: variant.salePrice, name: `${l.name.split(' (')[0]} (${variant.name})` };
      })
    );
  };

  const runSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchProducts(term);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const addProduct = (product: any) => {
    // M4: batch/serial-tracked items need a batch/serial picker this editor doesn't have. Fail
    // loudly here rather than let the server reject mid-submit — and never let a BATCH/SERIAL
    // line silently lose its reference and touch the base product's stock.
    if (product.productType === 'BATCH' || product.productType === 'SERIAL') {
      setError('Batch/serial-tracked products can\'t be added while editing an invoice — create a new sale for these instead.');
      setShowSearch(false);
      setSearchTerm('');
      setSearchResults([]);
      return;
    }
    if (product.productType === 'VARIANT' && product.variants?.length > 0) {
      const v = product.variants[0];
      setLines((prev) => [
        ...prev,
        {
          cartId: `new-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: `${product.name} (${v.name})`,
          variantId: v.id,
          batchId: null,
          serialId: null,
          productType: 'VARIANT',
          salePrice: v.salePrice,
          quantity: 1,
          availableVariants: product.variants.map((v: any) => ({ id: v.id, name: v.name, salePrice: v.salePrice })),
        },
      ]);
    } else {
      setLines((prev) => [
        ...prev,
        {
          cartId: `new-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          variantId: null,
          batchId: null,
          serialId: null,
          productType: product.productType || 'SIMPLE',
          salePrice: product.salePrice,
          quantity: 1,
          availableVariants: [],
        },
      ]);
    }
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (lines.length === 0) {
      setError('An invoice must have at least one item — remove the whole thing via a future void/refund flow instead.');
      return;
    }
    if (!reason.trim()) {
      setError('Enter a reason for this edit.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            batchId: l.batchId,
            serialId: l.serialId,
            productType: l.productType,
            quantity: l.quantity,
            salePrice: l.salePrice,
            titleOverride: l.name,
          })),
          notes: notes.trim() || null,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update invoice');
      router.push(`/billing/${transaction.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/billing/${transaction.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Invoice
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Invoice #{transaction.id.substring(0, 8).toUpperCase()}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Taxes, discounts, and the grand total recalculate automatically. Every edit is recorded with who made it, when, and why.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
        )}

        <div className="space-y-3 mb-4">
          {lines.map((line) => (
            <div key={line.cartId} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{line.name}</p>
                <p className="text-xs text-gray-500">₹{line.salePrice.toFixed(2)} each</p>
                {line.availableVariants.length > 1 && (
                  <select
                    value={line.variantId || ''}
                    onChange={(e) => changeVariant(line.cartId, e.target.value)}
                    className="mt-1 text-xs border border-gray-200 rounded-lg px-2 py-1"
                  >
                    {line.availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} — ₹{v.salePrice.toFixed(2)}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(line.cartId, -1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-6 text-center tabular-nums">{line.quantity}</span>
                <button onClick={() => updateQuantity(line.cartId, 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm font-bold text-gray-900 w-20 text-right tabular-nums">₹{(line.salePrice * line.quantity).toFixed(2)}</span>
              <button onClick={() => removeLine(line.cartId)} className="text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        ) : (
          <div className="border border-gray-200 rounded-xl p-3 mb-4">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Search products by name or barcode..."
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button onClick={() => { setShowSearch(false); setSearchTerm(''); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {searching && <p className="text-xs text-gray-400 px-1">Searching…</p>}
            <div className="max-h-56 overflow-y-auto space-y-1">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-gray-500">
                    {p.productType === 'VARIANT' && p.variants?.length > 0
                      ? `From ₹${Math.min(...p.variants.map((v: any) => v.salePrice)).toFixed(0)}`
                      : `₹${p.salePrice.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-base font-bold text-gray-900">
          <span>Subtotal</span>
          <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Tax, bill discount, and coupon/loyalty amounts recalculate from this when you save.</p>

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Edit *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            placeholder="e.g. Customer changed their mind on the second item"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || lines.length === 0 || !reason.trim()}
          className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
