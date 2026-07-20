"use client";

import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';

interface CafeItemModalProps {
  product: any;
  onClose: () => void;
  onConfirm: (selection: {
    variantId: string | null;
    variantName: string | null;
    unitPrice: number;
    selectedAddOns: { id: string; name: string; price: number }[];
    quantity: number;
  }) => void;
}

export default function CafeItemModal({ product, onClose, onConfirm }: CafeItemModalProps) {
  const hasVariants = product.variants && product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(hasVariants ? product.variants[0].id : null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = hasVariants ? product.variants.find((v: any) => v.id === variantId) : null;
  const basePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const addOnsTotal = (product.addOns || [])
    .filter((a: any) => selectedAddOnIds.has(a.id))
    .reduce((sum: number, a: any) => sum + a.price, 0);
  const unitPrice = basePrice + addOnsTotal;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      variantId,
      variantName: selectedVariant?.name || null,
      unitPrice,
      selectedAddOns: (product.addOns || []).filter((a: any) => selectedAddOnIds.has(a.id)).map((a: any) => ({ id: a.id, name: a.name, price: a.price })),
      quantity,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {hasVariants && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      variantId === v.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {v.name}<br /><span className="font-normal text-xs">₹{v.salePrice.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.addOns && product.addOns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Add-ons</h3>
              <div className="space-y-2">
                {product.addOns.map((a: any) => (
                  <label key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAddOnIds.has(a.id)}
                        onChange={() => toggleAddOn(a.id)}
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-800">{a.name}</span>
                    </span>
                    <span className="text-sm text-gray-500">+₹{a.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quantity</h3>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-gray-900 w-8 text-center">{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
          >
            Add {quantity} to Order — ₹{(unitPrice * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
