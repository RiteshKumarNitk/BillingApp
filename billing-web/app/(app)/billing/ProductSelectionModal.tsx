import React, { useState } from 'react';
import { X, Package, Scale, Layers, Hash, Check } from 'lucide-react';

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

  const typeIcon = () => {
    switch (product.productType) {
      case 'VARIANT': return <Layers className="w-5 h-5" />;
      case 'WEIGHT': return <Scale className="w-5 h-5" />;
      case 'BATCH': return <Hash className="w-5 h-5" />;
      case 'SERIAL': return <Hash className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const typeLabel = () => {
    switch (product.productType) {
      case 'VARIANT': return 'Select Variant';
      case 'WEIGHT': return 'Enter Weight / Quantity';
      case 'BATCH': return 'Select Batch';
      case 'SERIAL': return 'Select Serial Number';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
              {typeIcon()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{product.productType}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {typeIcon()}
            {typeLabel()}
          </h3>

          {product.productType === 'VARIANT' && (
            <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {product.variants?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedVariant?.id === v.id
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedVariant?.id === v.id ? 'border-indigo-500' : 'border-gray-300'
                    }`}>
                      {selectedVariant?.id === v.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{v.name}</p>
                      <p className="text-xs text-gray-500">Stock: {v.stock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-indigo-600">₹{v.salePrice.toFixed(2)}</p>
                    {v.mrp > v.salePrice && (
                      <p className="text-[10px] text-gray-400 line-through">₹{v.mrp.toFixed(2)}</p>
                    )}
                  </div>
                </button>
              ))}
              {(!product.variants || product.variants.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No variants available.</p>
                </div>
              )}
            </div>
          )}

          {product.productType === 'WEIGHT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Quantity ({product.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={product.allowDecimal ? '0.001' : '1'}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-lg p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white tabular-nums"
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                    {product.unit} @ ₹{product.salePrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl flex justify-between items-center border border-indigo-100/50">
                <div>
                  <span className="text-sm text-gray-600 font-medium">Total Price</span>
                  <p className="text-xs text-gray-400">{weight || '0'} × ₹{product.salePrice.toFixed(2)}</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600 tabular-nums">
                  ₹{((parseFloat(weight) || 0) * product.salePrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {product.productType === 'BATCH' && (
            <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {product.batches?.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatch(b)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedBatch?.id === b.id
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBatch?.id === b.id ? 'border-indigo-500' : 'border-gray-300'
                    }`}>
                      {selectedBatch?.id === b.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Batch: {b.batchNumber}</p>
                      <p className="text-xs text-gray-500">Stock: {b.stock}</p>
                    </div>
                  </div>
                  {b.expiryDate && (
                    <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-lg">
                      Exp: {new Date(b.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
              {(!product.batches || product.batches.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No batches available.</p>
                </div>
              )}
            </div>
          )}

          {product.productType === 'SERIAL' && (
            <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {product.serials?.filter((s:any) => s.status === 'AVAILABLE').map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSerial(s)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedSerial?.id === s.id
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedSerial?.id === s.id ? 'border-indigo-500' : 'border-gray-300'
                    }`}>
                      {selectedSerial?.id === s.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <span className="font-mono text-sm text-gray-900">{s.serialNumber}</span>
                  </div>
                  {selectedSerial?.id === s.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
              {(!product.serials || product.serials.filter((s:any) => s.status === 'AVAILABLE').length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No available serials.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
          >
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
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Add to Bill
          </button>
        </div>
      </div>
    </div>
  );
}
