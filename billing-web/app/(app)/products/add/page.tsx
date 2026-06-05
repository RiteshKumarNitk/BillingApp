"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/actions/products';
import Link from 'next/link';
import {
  ArrowLeft, Package, Tag, IndianRupee, Boxes, Hash, Info, Plus, Trash2
} from 'lucide-react';
import ImageUpload from '../../tenants/add/ImageUpload';

const PRESET_CATEGORIES = [
  'Vegetables', 'Fruits', 'Grocery', 'FMCG', 'Medical',
  'Dairy', 'Hardware', 'Clothing', 'Electronics', 'Restaurant'
];

export default function AddProductPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    productType: 'SIMPLE',
    unit: 'PIECE',
    allowDecimal: false,
    purchasePrice: '',
    mrp: '',
    salePrice: '',
    stock: '',
    minStockThreshold: '10',
    barcode: '',
    imageUrl: '',
  });

  const [variants, setVariants] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [serials, setSerials] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleAddVariant = () => setVariants([...variants, { name: '', barcode: '', purchasePrice: '', mrp: '', salePrice: '', stock: '' }]);
  const handleRemoveVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
  const handleVariantChange = (idx: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[idx][field] = value;
    setVariants(newVariants);
  };

  const handleAddBatch = () => setBatches([...batches, { batchNumber: '', manufacturingDate: '', expiryDate: '', stock: '' }]);
  const handleRemoveBatch = (idx: number) => setBatches(batches.filter((_, i) => i !== idx));
  const handleBatchChange = (idx: number, field: string, value: string) => {
    const newBatches = [...batches];
    newBatches[idx][field] = value;
    setBatches(newBatches);
  };

  const handleAddSerial = () => setSerials([...serials, { serialNumber: '' }]);
  const handleRemoveSerial = (idx: number) => setSerials(serials.filter((_, i) => i !== idx));
  const handleSerialChange = (idx: number, value: string) => {
    const newSerials = [...serials];
    newSerials[idx].serialNumber = value;
    setSerials(newSerials);
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
        variants: (formData.productType === 'VARIANT' || formData.productType === 'WEIGHT') ? variants : undefined,
        batches: formData.productType === 'BATCH' ? batches : undefined,
        serials: formData.productType === 'SERIAL' ? serials : undefined,
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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/products" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define behavior and inventory tracking for this item.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Behavior & Identity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 text-indigo-600">
            <Package className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-gray-800">Identity & Behavior</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-6 border-b border-gray-100 pb-6 mb-2">
              <ImageUpload 
                label="Product Image (Optional)" 
                onUploadSuccess={(url) => setFormData(prev => ({...prev, imageUrl: url}))} 
              />
              <div className="flex-1 mt-2">
                <p className="text-sm font-medium text-gray-700">Display Image</p>
                <p className="text-xs text-gray-500 mt-1">Upload a clear picture of the product to show on the POS and digital menus.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 bg-indigo-50/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium"
                >
                  <option value="SIMPLE">Simple Product (Generic item)</option>
                  <option value="WEIGHT">Weight Based (Loose items, Vegetables)</option>
                  <option value="VARIANT">Variant Based (Sizes, Packaging)</option>
                  <option value="BATCH">Batch Managed (Medicines, FMCG)</option>
                  <option value="SERIAL">Serial Managed (Electronics, IMEI)</option>
                  <option value="SERVICE">Service (No inventory)</option>
                </select>
              </div>
              
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
                  placeholder="e.g. Potato, Dove Soap, iPhone 15"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
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

              {formData.category === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Category</label>
                  <input
                    type="text"
                    name="customCategory"
                    value={formData.customCategory}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g. PIECE, KG, GRAM"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all uppercase"
                />
              </div>
              
              {formData.productType === 'WEIGHT' && (
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowDecimal"
                      checked={formData.allowDecimal}
                      onChange={handleChange}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-900">Allow Decimal Quantity (e.g. 1.25 KG)</span>
                  </label>
                </div>
              )}
              
              {(formData.productType === 'SIMPLE' || formData.productType === 'WEIGHT' || formData.productType === 'SERVICE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Master Barcode / SKU</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Stock (Only for SIMPLE / WEIGHT / SERVICE) */}
        {(formData.productType === 'SIMPLE' || formData.productType === 'WEIGHT' || formData.productType === 'SERVICE') && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <IndianRupee className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                {formData.productType === 'WEIGHT' ? 'Rate per Unit' : 'Pricing & Inventory'}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price</label>
                  <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP</label>
                  <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} min="0" step="0.01" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price <span className="text-rose-500">*</span></label>
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" step="0.01" required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
              </div>
              
              {formData.productType !== 'SERVICE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Stock</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" step="any" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Stock Alert</label>
                    <input type="number" name="minStockThreshold" value={formData.minStockThreshold} onChange={handleChange} min="0" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: VARIANTS */}
        {(formData.productType === 'VARIANT' || formData.productType === 'WEIGHT') && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Selling Variants</h2>
              <button type="button" onClick={handleAddVariant} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                <Plus className="w-4 h-4" /> Add Variant
              </button>
            </div>
            <div className="p-6">
              {variants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">No variants added yet. Click "Add Variant" to create sizes, weights, or packages.</p>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-4 bg-gray-50 border border-gray-100 rounded-xl relative">
                      <button type="button" onClick={() => handleRemoveVariant(idx)} className="absolute -top-2 -right-2 bg-white border border-rose-200 text-rose-500 p-1.5 rounded-full shadow-sm hover:bg-rose-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Variant Name (e.g. 500g, XL)</label>
                        <input type="text" value={v.name} onChange={(e) => handleVariantChange(idx, 'name', e.target.value)} required className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/6">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sale Price</label>
                        <input type="number" step="0.01" value={v.salePrice} onChange={(e) => handleVariantChange(idx, 'salePrice', e.target.value)} required className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/6">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                        <input type="number" step="any" value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Barcode (Optional)</label>
                        <input type="text" value={v.barcode} onChange={(e) => handleVariantChange(idx, 'barcode', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: BATCHES */}
        {formData.productType === 'BATCH' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Batch Management</h2>
              <button type="button" onClick={handleAddBatch} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                <Plus className="w-4 h-4" /> Add Batch
              </button>
            </div>
            <div className="p-6">
              {/* Batch Products need a base price for all batches usually, or variant prices. We'll use Base Price from formData */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Sale Price <span className="text-rose-500">*</span></label>
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" step="0.01" required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Master Barcode / SKU</label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
              </div>

              {batches.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No batches added. Click "Add Batch" to input inventory.</p>
              ) : (
                <div className="space-y-4">
                  {batches.map((b, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-4 bg-gray-50 border border-gray-100 rounded-xl relative">
                      <button type="button" onClick={() => handleRemoveBatch(idx)} className="absolute -top-2 -right-2 bg-white border border-rose-200 text-rose-500 p-1.5 rounded-full shadow-sm hover:bg-rose-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Batch Number</label>
                        <input type="text" value={b.batchNumber} onChange={(e) => handleBatchChange(idx, 'batchNumber', e.target.value)} required className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Mfg Date</label>
                        <input type="date" value={b.manufacturingDate} onChange={(e) => handleBatchChange(idx, 'manufacturingDate', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                        <input type="date" value={b.expiryDate} onChange={(e) => handleBatchChange(idx, 'expiryDate', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                        <input type="number" step="any" value={b.stock} onChange={(e) => handleBatchChange(idx, 'stock', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: SERIALS */}
        {formData.productType === 'SERIAL' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Serial Numbers / IMEIs</h2>
              <button type="button" onClick={handleAddSerial} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                <Plus className="w-4 h-4" /> Add Serial
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price <span className="text-rose-500">*</span></label>
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" step="0.01" required className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Master SKU</label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
              </div>

              {serials.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No serials added.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {serials.map((s, idx) => (
                    <div key={idx} className="flex items-center relative">
                      <input type="text" placeholder="Enter IMEI / Serial" value={s.serialNumber} onChange={(e) => handleSerialChange(idx, e.target.value)} required className="w-full text-sm border-gray-300 rounded-lg pr-10" />
                      <button type="button" onClick={() => handleRemoveSerial(idx)} className="absolute right-2 text-gray-400 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Add Product'}
          </button>
        </div>

      </form>
    </div>
  );
}