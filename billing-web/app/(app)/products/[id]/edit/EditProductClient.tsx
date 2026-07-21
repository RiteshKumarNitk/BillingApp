"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, getProductsForComboPicker } from '@/lib/actions/products';
import { getUnits, createUnit } from '@/lib/actions/units';
import Link from 'next/link';
import {
  ArrowLeft, Package, Tag, IndianRupee, Globe, Info, Plus, Trash2
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import {
  getProductTypeOptions, getPresetCategories, getCategoryLabel,
  hideStockFields, showGarmentType, showDuration, showAddOns, showComboComponents,
  showFoodType, showGstFields, showAvailabilityToggle, showFeaturedToggle, showPrepTime,
  getProductNoun, FOOD_TYPE_OPTIONS
} from '@/lib/productForm/businessTypeConfig';

export default function EditProductClient({ product, businessType }: { product: any; businessType: string | null }) {
  const router = useRouter();

  const productTypeOptions = getProductTypeOptions(businessType);
  const presetCategories = getPresetCategories(businessType);
  const categoryLabel = getCategoryLabel(businessType);
  const productNoun = getProductNoun(businessType);

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const isPresetCategory = presetCategories.includes(product.category || '');

  const [formData, setFormData] = useState({
    name: product.name || '',
    category: isPresetCategory ? product.category : (product.category ? 'Other' : ''),
    customCategory: isPresetCategory ? '' : (product.category || ''),
    productType: product.productType || 'SIMPLE',
    unit: product.unit || 'PIECE',
    allowDecimal: product.allowDecimal || false,
    purchasePrice: product.purchasePrice?.toString() || '0',
    mrp: product.mrp?.toString() || '0',
    salePrice: product.salePrice?.toString() || '0',
    stock: product.stock?.toString() || '0',
    minStockThreshold: product.minStockThreshold?.toString() || '10',
    barcode: product.barcode || '',
    imageUrl: product.imageUrl || '',
    description: product.description || '',
    durationMinutes: product.durationMinutes?.toString() || '',
    garmentType: product.garmentType || '',
    gstRate: product.gstRate !== null && product.gstRate !== undefined ? product.gstRate.toString() : '',
    gstInclusive: product.gstInclusive || false,
    foodType: product.foodType || '',
    isAvailable: product.isAvailable !== false,
    isFeatured: product.isFeatured || false,
  });

  const [variants, setVariants] = useState<any[]>(
    product.variants?.map((v: any) => ({
      ...v,
      purchasePrice: v.purchasePrice?.toString() || '0',
      mrp: v.mrp?.toString() || '0',
      salePrice: v.salePrice?.toString() || '0',
      stock: v.stock?.toString() || '0',
    })) || []
  );

  const [batches, setBatches] = useState<any[]>(
    product.batches?.map((b: any) => ({
      ...b,
      manufacturingDate: formatDateForInput(b.manufacturingDate),
      expiryDate: formatDateForInput(b.expiryDate),
      stock: b.stock?.toString() || '0',
    })) || []
  );

  const [serials, setSerials] = useState<any[]>(
    product.serials?.map((s: any) => ({ ...s })) || []
  );

  const [addOns, setAddOns] = useState<{ name: string; price: string }[]>(
    product.addOns?.map((a: any) => ({ name: a.name, price: a.price?.toString() || '0' })) || []
  );
  const [comboComponents, setComboComponents] = useState<{ componentId: string; componentVariantId: string | null; quantity: string }[]>(
    product.comboComponents?.map((c: any) => ({ componentId: c.componentId, componentVariantId: c.componentVariantId ?? null, quantity: c.quantity?.toString() || '1' })) || []
  );
  const [comboCandidates, setComboCandidates] = useState<{ id: string; name: string; salePrice: number; variants: { id: string; name: string; salePrice: number }[] }[]>(
    product.comboComponents?.map((c: any) => ({ ...c.component, variants: c.component?.variants || [] })) || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [addUnitLoading, setAddUnitLoading] = useState(false);

  useEffect(() => {
    getUnits().then(setUnits).catch(() => {});
  }, []);

  useEffect(() => {
    if (showComboComponents(businessType, formData.productType)) {
      getProductsForComboPicker(product.id).then(setComboCandidates).catch(() => {});
    }
  }, [businessType, formData.productType]);

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    setAddUnitLoading(true);
    try {
      const unit = await createUnit(newUnitName);
      setUnits(prev => [...prev, unit].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, unit: unit.name }));
      setNewUnitName('');
      setShowAddUnit(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setAddUnitLoading(false);
    }
  };

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

  const handleAddSerial = () => setSerials([...serials, { serialNumber: '', status: 'AVAILABLE' }]);
  const handleRemoveSerial = (idx: number) => setSerials(serials.filter((_, i) => i !== idx));
  const handleSerialChange = (idx: number, field: string, value: string) => {
    const newSerials = [...serials];
    newSerials[idx][field] = value;
    setSerials(newSerials);
  };

  const handleAddAddOn = () => setAddOns([...addOns, { name: '', price: '' }]);
  const handleRemoveAddOn = (idx: number) => setAddOns(addOns.filter((_, i) => i !== idx));
  const handleAddOnChange = (idx: number, field: 'name' | 'price', value: string) => {
    const next = [...addOns];
    next[idx][field] = value;
    setAddOns(next);
  };

  const handleAddComboComponent = () => setComboComponents([...comboComponents, { componentId: '', componentVariantId: null, quantity: '1' }]);
  const handleRemoveComboComponent = (idx: number) => setComboComponents(comboComponents.filter((_, i) => i !== idx));
  const handleComboComponentChange = (idx: number, field: 'quantity', value: string) => {
    const next = [...comboComponents];
    next[idx][field] = value;
    setComboComponents(next);
  };
  const handleComboItemSelect = (idx: number, compositeValue: string) => {
    const [componentId, componentVariantId] = compositeValue.split('::');
    const next = [...comboComponents];
    next[idx] = { ...next[idx], componentId: componentId || '', componentVariantId: componentVariantId || null };
    setComboComponents(next);
  };

  const suggestedComboPrice = comboComponents.reduce((sum, c) => {
    const candidate = comboCandidates.find(p => p.id === c.componentId);
    if (!candidate) return sum;
    const unitPrice = c.componentVariantId
      ? candidate.variants.find(v => v.id === c.componentVariantId)?.salePrice ?? candidate.salePrice
      : candidate.salePrice;
    return sum + unitPrice * (parseInt(c.quantity, 10) || 1);
  }, 0);

  const showStock = !hideStockFields(businessType) && formData.productType !== 'SERVICE' && formData.productType !== 'COMBO';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;

      await updateProduct(product.id, {
        ...formData,
        category: finalCategory || null,
        variants: (formData.productType === 'VARIANT' || formData.productType === 'WEIGHT') ? variants : undefined,
        batches: formData.productType === 'BATCH' ? batches : undefined,
        serials: formData.productType === 'SERIAL' ? serials : undefined,
        addOns: showAddOns(businessType, formData.productType) ? addOns : undefined,
        comboComponents: showComboComponents(businessType, formData.productType) ? comboComponents : undefined,
      });

      setSuccess(true);
      setTimeout(() => router.push(`/products/${product.id}`), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
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
        <h2 className="text-xl font-bold text-gray-900">{productNoun} Updated!</h2>
        <p className="text-gray-500 mt-1">Redirecting to {productNoun.toLowerCase()} details…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-center gap-3">
        <Link href={`/products/${product.id}`} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit {productNoun}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update behavior and inventory tracking for {product.name}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 text-indigo-600">
            <Package className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-gray-800">Basic Information</h2>
          </div>
          <div className="p-6 space-y-5">
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
                  {productTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {productNoun} Name <span className="text-rose-500">*</span>
                </label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Base Unit</label>
                <button
                  type="button"
                  onClick={() => setShowAddUnit(v => !v)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {showAddUnit ? 'Cancel' : '+ New unit'}
                </button>
              </div>
              {showAddUnit ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
                    placeholder="e.g. BAG, ROLL, BOTTLE"
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    disabled={addUnitLoading || !newUnitName.trim()}
                    className="rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {addUnitLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ) : (
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full max-w-xs rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
                >
                  {/* Keep the product's current value selectable even if it predates the Units master or was deleted from it */}
                  {formData.unit && !units.some(u => u.name === formData.unit) && (
                    <option value={formData.unit}>{formData.unit}</option>
                  )}
                  {units.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              )}
              <Link href="/products/units" className="mt-1 inline-block text-xs text-gray-400 hover:text-gray-600">
                Manage units
              </Link>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <IndianRupee className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-800">Pricing</h2>
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
                {formData.productType === 'COMBO' && suggestedComboPrice > 0 && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                    <span>Suggested: ₹{suggestedComboPrice.toFixed(2)} (sum of components)</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, salePrice: suggestedComboPrice.toFixed(2) }))}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Use this
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showGstFields(businessType) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 pt-5 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Rate (%)</label>
                  <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} min="0" max="100" step="0.01" placeholder="e.g. 5" className="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="gstInclusive" checked={formData.gstInclusive} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">Sale Price already includes GST</span>
                  </label>
                </div>
              </div>
            )}

            {showStock && (
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

        {/* Section 3: Business Specific Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-800">Business Specific Information</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{categoryLabel}</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 bg-white">
                  <option value="">Select {categoryLabel.toLowerCase()}…</option>
                  {presetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Other">Other (custom)</option>
                </select>
              </div>

              {formData.category === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom {categoryLabel}</label>
                  <input type="text" name="customCategory" value={formData.customCategory} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900" />
                </div>
              )}

              {showGarmentType(businessType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Garment Type</label>
                  <input
                    type="text"
                    name="garmentType"
                    value={formData.garmentType}
                    onChange={handleChange}
                    placeholder="e.g. Shirt, Trouser, Saree, Bedsheet"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
                  />
                </div>
              )}

              {showDuration(businessType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
                  />
                </div>
              )}

              {showPrepTime(businessType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prep Time (minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900"
                  />
                </div>
              )}

              {showFoodType(businessType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Food Type</label>
                  <select name="foodType" value={formData.foodType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 bg-white">
                    <option value="">Not specified</option>
                    {FOOD_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.productType === 'WEIGHT' && (
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="allowDecimal" checked={formData.allowDecimal} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">Allow Decimal Quantity (e.g. 1.25 KG)</span>
                  </label>
                </div>
              )}

              {(formData.productType === 'SIMPLE' || formData.productType === 'WEIGHT' || formData.productType === 'SERVICE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Master Barcode / SKU</label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900" />
                </div>
              )}

              {(showAvailabilityToggle(businessType) || showFeaturedToggle(businessType)) && (
                <div className="flex items-center gap-6">
                  {showAvailabilityToggle(businessType) && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-900">Available</span>
                    </label>
                  )}
                  {showFeaturedToggle(businessType) && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-gray-900">Featured</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Variants */}
            {(formData.productType === 'VARIANT' || formData.productType === 'WEIGHT') && (
              <div className="pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Selling Variants</h3>
                  <button type="button" onClick={handleAddVariant} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No variants added yet.</p>
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
                        {showStock && (
                          <div className="w-full md:w-1/6">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                            <input type="number" step="any" value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                          </div>
                        )}
                        <div className="w-full md:w-1/3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Barcode (Optional)</label>
                          <input type="text" value={v.barcode || ''} onChange={(e) => handleVariantChange(idx, 'barcode', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cafe: Add-ons */}
            {showAddOns(businessType, formData.productType) && (
              <div className="pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Add-ons</h3>
                  <button type="button" onClick={handleAddAddOn} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                    <Plus className="w-4 h-4" /> Add Add-on
                  </button>
                </div>
                {addOns.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No add-ons yet, e.g. "Extra Shot +₹15".</p>
                ) : (
                  <div className="space-y-3">
                    {addOns.map((a, idx) => (
                      <div key={idx} className="flex gap-3 items-end p-3 bg-gray-50 border border-gray-100 rounded-xl relative">
                        <button type="button" onClick={() => handleRemoveAddOn(idx)} className="absolute -top-2 -right-2 bg-white border border-rose-200 text-rose-500 p-1.5 rounded-full shadow-sm hover:bg-rose-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                          <input type="text" value={a.name} onChange={(e) => handleAddOnChange(idx, 'name', e.target.value)} placeholder="e.g. Extra Shot" required className="w-full text-sm border-gray-300 rounded-lg" />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                          <input type="number" step="0.01" min="0" value={a.price} onChange={(e) => handleAddOnChange(idx, 'price', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cafe: Combo Components */}
            {showComboComponents(businessType, formData.productType) && (
              <div className="pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Combo Components</h3>
                  <button type="button" onClick={handleAddComboComponent} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">What's included, shown on receipts and the kitchen ticket. The combo is billed at its own Sale Price above, not the sum of these.</p>
                {comboComponents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No items added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comboComponents.map((c, idx) => (
                      <div key={idx} className="flex gap-3 items-end p-3 bg-gray-50 border border-gray-100 rounded-xl relative">
                        <button type="button" onClick={() => handleRemoveComboComponent(idx)} className="absolute -top-2 -right-2 bg-white border border-rose-200 text-rose-500 p-1.5 rounded-full shadow-sm hover:bg-rose-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
                          <select
                            value={c.componentVariantId ? `${c.componentId}::${c.componentVariantId}` : c.componentId}
                            onChange={(e) => handleComboItemSelect(idx, e.target.value)}
                            required
                            className="w-full text-sm border-gray-300 rounded-lg bg-white"
                          >
                            <option value="">Select item…</option>
                            {comboCandidates.map(p => (
                              p.variants.length > 0 ? (
                                p.variants.map(v => (
                                  <option key={v.id} value={`${p.id}::${v.id}`}>{p.name} — {v.name} (₹{v.salePrice})</option>
                                ))
                              ) : (
                                <option key={p.id} value={p.id}>{p.name} (₹{p.salePrice})</option>
                              )
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                          <input type="number" min="1" value={c.quantity} onChange={(e) => handleComboComponentChange(idx, 'quantity', e.target.value)} className="w-full text-sm border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Website Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-800">Website Information</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-6">
              <ImageUpload
                label={`${productNoun} Image (Optional)`}
                defaultImage={formData.imageUrl}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              />
              <div className="flex-1 mt-2">
                <p className="text-sm font-medium text-gray-700">Display Image</p>
                <p className="text-xs text-gray-500 mt-1">Shown on the POS, your digital menu/shop page, and your public website.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Shown to customers on your public menu/shop page"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Advanced (Batch / Serial — retail & medical inventory features) */}
        {formData.productType === 'BATCH' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Advanced: Batch Management</h2>
              <button type="button" onClick={handleAddBatch} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                <Plus className="w-4 h-4" /> Add Batch
              </button>
            </div>
            <div className="p-6">
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
                <p className="text-gray-500 text-sm text-center py-4">No batches added.</p>
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

        {formData.productType === 'SERIAL' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Advanced: Serial Numbers / IMEIs</h2>
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
                    <div key={idx} className="flex flex-col relative bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-semibold text-gray-500">Serial {idx+1}</span>
                         <button type="button" onClick={() => handleRemoveSerial(idx)} className="text-gray-400 hover:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                      <input type="text" placeholder="Enter IMEI / Serial" value={s.serialNumber} onChange={(e) => handleSerialChange(idx, 'serialNumber', e.target.value)} required className="w-full text-sm border-gray-300 rounded-lg mb-2" />
                      <select value={s.status} onChange={(e) => handleSerialChange(idx, 'status', e.target.value)} className="w-full text-xs border-gray-300 rounded-lg bg-white">
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="SOLD">SOLD</option>
                        <option value="DEFECTIVE">DEFECTIVE</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href={`/products/${product.id}`} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
