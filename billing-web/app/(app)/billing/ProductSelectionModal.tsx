import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

export default function ProductSelectionModal({ 
  product, 
  onClose, 
  onConfirm 
}: { 
  product: any; 
  onClose: () => void; 
  onConfirm: (data: any) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [selectedSerial, setSelectedSerial] = useState<any>(null);
  const [weight, setWeight] = useState<string>('1');

  const handleConfirm = () => {
    let price = product.salePrice;
    let title = product.name;
    let qty = 1;

    if (product.productType === 'VARIANT') {
      if (!selectedVariant) return;
      price = selectedVariant.salePrice;
      title = `${product.name} - ${selectedVariant.name}`;
      onConfirm({
        variantId: selectedVariant.id,
        salePrice: price,
        titleOverride: title,
        quantity: 1,
        purchasePrice: selectedVariant.purchasePrice,
        mrp: selectedVariant.mrp
      });
    } else if (product.productType === 'BATCH') {
      if (!selectedBatch) return;
      title = `${product.name} (Batch: ${selectedBatch.batchNumber})`;
      onConfirm({
        batchId: selectedBatch.id,
        salePrice: price,
        titleOverride: title,
        quantity: 1
      });
    } else if (product.productType === 'SERIAL') {
      if (!selectedSerial) return;
      title = `${product.name} (SN: ${selectedSerial.serialNumber})`;
      onConfirm({
        serialId: selectedSerial.id,
        salePrice: price,
        titleOverride: title,
        quantity: 1
      });
    } else if (product.productType === 'WEIGHT') {
      qty = parseFloat(weight);
      if (isNaN(qty) || qty <= 0) return;
      title = `${product.name} (${qty} ${product.unit})`;
      onConfirm({
        quantity: qty,
        salePrice: price,
        titleOverride: title
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {product.productType === 'VARIANT' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Select Variant</h3>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                {product.variants?.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                      selectedVariant?.id === v.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Stock: {v.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-indigo-600">₹{v.salePrice.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
                {(!product.variants || product.variants.length === 0) && (
                  <p className="text-sm text-gray-500">No variants available.</p>
                )}
              </div>
            </div>
          )}

          {product.productType === 'WEIGHT' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Enter Weight / Quantity</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Quantity ({product.unit}) @ ₹{product.salePrice.toFixed(2)} / {product.unit}
                </label>
                <input
                  type="number"
                  step={product.allowDecimal ? '0.001' : '1'}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-lg p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mt-4">
                <span className="text-gray-600 font-medium">Total Price:</span>
                <span className="text-xl font-bold text-indigo-600">
                  ₹{((parseFloat(weight) || 0) * product.salePrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {product.productType === 'BATCH' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Select Batch</h3>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                {product.batches?.map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBatch(b)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-colors ${
                      selectedBatch?.id === b.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between w-full mb-1">
                      <span className="font-medium text-gray-900">Batch: {b.batchNumber}</span>
                      <span className="text-sm text-gray-500">Stock: {b.stock}</span>
                    </div>
                    {b.expiryDate && (
                      <span className="text-xs text-rose-600 font-medium">Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                    )}
                  </button>
                ))}
                {(!product.batches || product.batches.length === 0) && (
                  <p className="text-sm text-gray-500">No batches available.</p>
                )}
              </div>
            </div>
          )}

          {product.productType === 'SERIAL' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Select Serial Number</h3>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2">
                {product.serials?.filter((s:any) => s.status === 'AVAILABLE').map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSerial(s)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                      selectedSerial?.id === s.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-mono text-sm text-gray-900">{s.serialNumber}</span>
                  </button>
                ))}
                {(!product.serials || product.serials.filter((s:any) => s.status === 'AVAILABLE').length === 0) && (
                  <p className="text-sm text-gray-500">No available serials.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              (product.productType === 'VARIANT' && !selectedVariant) ||
              (product.productType === 'BATCH' && !selectedBatch) ||
              (product.productType === 'SERIAL' && !selectedSerial) ||
              (product.productType === 'WEIGHT' && (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0))
            }
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Bill
          </button>
        </div>
      </div>
    </div>
  );
}
