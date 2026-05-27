"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/actions/products';
import Link from 'next/link';
import {
  ArrowLeft, Package, Tag, IndianRupee, Boxes,
  ChevronDown, ChevronUp, Barcode, CalendarDays, Hash, Info
} from 'lucide-react';

// ─── Unit Config ──────────────────────────────────────────────────────────────

const ALL_UNITS = [
  'KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACKET',
  'BOX', 'BOTTLE', 'TABLET', 'STRIP', 'BAG', 'DOZEN', 'METER', 'VIAL'
];

const CATEGORY_UNIT_MAP: Record<string, string[]> = {
  'Vegetables':   ['KG', 'GRAM', 'PIECE'],
  'Fruits':       ['KG', 'GRAM', 'PIECE', 'DOZEN'],
  'Grocery':      ['KG', 'GRAM', 'LITER', 'ML', 'PACKET'],
  'FMCG':         ['PIECE', 'PACKET', 'BOX', 'BOTTLE'],
  'Medical':      ['TABLET', 'STRIP', 'BOTTLE', 'VIAL', 'PIECE'],
  'Dairy':        ['LITER', 'ML', 'GRAM', 'PIECE', 'PACKET'],
  'Hardware':     ['BAG', 'METER', 'PIECE', 'KG', 'LITER'],
  'Clothing':     ['PIECE', 'METER', 'PACKET', 'DOZEN'],
  'Electronics':  ['PIECE', 'BOX'],
  'Restaurant':   ['KG', 'GRAM', 'LITER', 'PIECE', 'BOTTLE', 'PACKET'],
};

// Categories where batch/expiry/mfg fields are not relevant
const HIDE_BATCH_CATEGORIES = new Set(['Vegetables', 'Fruits', 'Hardware', 'Electronics', 'Clothing']);

const PRESET_CATEGORIES = [
  'Vegetables', 'Fruits', 'Grocery', 'FMCG', 'Medical',
  'Dairy', 'Hardware', 'Clothing', 'Electronics', 'Restaurant'
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    unit: 'PIECE',
    purchasePrice: '',
    mrp: '',
    salePrice: '',
    stock: '',
    minStockThreshold: '10',
    barcode: '',
    expiryDate: '',
    manufacturingDate: '',
    batchNumber: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Derive suggested units from selected category
  const suggestedUnits = useMemo(() => {
    const cat = formData.category === 'Other' ? formData.customCategory : formData.category;
    return CATEGORY_UNIT_MAP[cat] ?? ALL_UNITS;
  }, [formData.category, formData.customCategory]);

  // Should we show batch/expiry/mfg fields?
  const showBatchFields = !HIDE_BATCH_CATEGORIES.has(formData.category);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Auto-update unit when category changes
      if (name === 'category' && value !== 'Other') {
        const suggested = CATEGORY_UNIT_MAP[value];
        if (suggested?.length) next.unit = suggested[0];
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalCategory = formData.category === 'Other'
        ? formData.customCategory
        : formData.category;

      await createProduct({
        ...formData,
        category: finalCategory || null,
      });

      setSuccess(true);
      setTimeout(() => router.push('/products'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Product Added!</h2>
        <p className="text-gray-500 mt-1">Redirecting to products list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link href="/products" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details for your inventory item.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Section 1: Basic Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 text-indigo-600">
            <Package className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-gray-800">Basic Information</h2>
          </div>
          <div className="p-6 space-y-5">

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Onion, Parle-G, Paracetamol 500mg"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">Select category…</option>
                  {PRESET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (custom)</option>
                </select>
              </div>

              {/* Custom category if "Other" */}
              {formData.category === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Category</label>
                  <input
                    type="text"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleChange}
                    placeholder="e.g. Stationery, Toys…"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Section 2: Pricing ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <IndianRupee className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-800">Pricing</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purchase Price (Cost)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0" step="0.01" placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 pl-7 pr-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    min="0" step="0.01" placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 pl-7 pr-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sale Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    min="0" step="0.01" placeholder="0.00" required
                    className="w-full rounded-xl border border-gray-300 pl-7 pr-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Inventory ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-800">Inventory</h2>
          </div>
          <div className="p-6 space-y-5">

            {/* Stock + Unit inline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock Quantity &amp; Unit
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0" placeholder="0"
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-36 rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium"
                >
                  {/* Show suggested units first */}
                  {suggestedUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  {/* Then remaining units not in suggested */}
                  {ALL_UNITS.filter(u => !suggestedUnits.includes(u)).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              {formData.category && formData.category !== 'Other' && (
                <p className="mt-1.5 text-xs text-indigo-600">
                  💡 Suggested for {formData.category}: {(CATEGORY_UNIT_MAP[formData.category] ?? []).join(', ')}
                </p>
              )}
            </div>

            {/* Low stock alert */}
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                name="minStockThreshold"
                value={formData.minStockThreshold}
                onChange={handleChange}
                min="0"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-400">Alert when stock falls below this number</p>
            </div>

          </div>
        </div>

        {/* ── Section 4: Advanced (collapsible) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                Advanced Details
                <span className="ml-2 text-xs font-normal text-gray-400">(barcode, expiry, batch — optional)</span>
              </h2>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showAdvanced && (
            <div className="p-6 border-t border-gray-100 space-y-5">

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Barcode className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                  Barcode / SKU
                  <span className="ml-1 text-xs text-gray-400 font-normal">(optional — leave blank if not applicable)</span>
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="e.g. 8901030123456"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Batch/Expiry/Mfg - shown conditionally */}
              {showBatchFields ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <CalendarDays className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <CalendarDays className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch Number</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      placeholder="e.g. B2024-01"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  💡 Batch number, expiry date, and manufacturing date are typically not applicable for <strong>{formData.category}</strong> products.
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : 'Add Product'}
          </button>
        </div>

      </form>
    </div>
  );
}