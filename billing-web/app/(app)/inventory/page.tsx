"use client";

import { useState, useEffect, useCallback } from 'react';
import { getFilteredProducts } from '@/lib/actions/products';
import { useToast } from '@/components/ui/Toast';
import { Package, Search, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function BulkInventoryPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [editedProducts, setEditedProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getFilteredProducts(searchTerm, '', false, 1, 100);
      setProducts(results.products);
      setEditedProducts({}); // Reset edits on fetch
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (id: string, field: string, value: string) => {
    setEditedProducts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const getDisplayValue = (product: any, field: string) => {
    if (editedProducts[product.id] && editedProducts[product.id][field] !== undefined) {
      return editedProducts[product.id][field];
    }
    return product[field];
  };

  const handleSaveAll = async () => {
    const idsToUpdate = Object.keys(editedProducts);
    if (idsToUpdate.length === 0) return;

    setSaving(true);
    try {
      const payload = idsToUpdate.map(id => {
        let original: any;
        let type = 'product';

        for (const p of products) {
          if (p.id === id) {
            original = p;
            type = 'product';
            break;
          }
          if (p.variants) {
            const v = p.variants.find((v: any) => v.id === id);
            if (v) {
              original = v;
              type = 'variant';
              break;
            }
          }
        }

        const edits = editedProducts[id];
        return {
          id,
          type,
          stock: edits.stock !== undefined ? edits.stock : original.stock,
          purchasePrice: edits.purchasePrice !== undefined ? edits.purchasePrice : original.purchasePrice,
          mrp: edits.mrp !== undefined ? edits.mrp : original.mrp,
          salePrice: edits.salePrice !== undefined ? edits.salePrice : original.salePrice,
        };
      });

      const res = await fetch('/api/inventory/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload })
      });

      if (!res.ok) throw new Error('Bulk update failed');

      addToast('success', `Successfully updated ${idsToUpdate.length} products`);
      await fetchProducts(); // Refetch
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  const pendingChangesCount = Object.keys(editedProducts).length;

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Inventory Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Quickly update stock and pricing for multiple items at once</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSaveAll}
            disabled={pendingChangesCount === 0 || saving}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Changes {pendingChangesCount > 0 && `(${pendingChangesCount})`}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-gray-900"
            />
          </div>
          {pendingChangesCount > 0 && (
            <div className="text-sm text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </div>
          )}
        </div>

        <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  MRP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.flatMap((product) => {
                  const isEdited = !!editedProducts[product.id];
                  
                  const renderRow = (item: any, isVariant = false, parentName?: string) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${!!editedProducts[item.id] ? 'bg-amber-50/30' : ''}`}>
                      <td className={`px-6 py-3 text-sm text-gray-900 font-medium ${isVariant ? 'pl-10' : ''}`}>
                        <div className="flex items-center gap-2">
                          {isVariant && <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
                          <div className="truncate max-w-[200px] sm:max-w-[300px]">
                            {isVariant ? item.name : item.name}
                          </div>
                        </div>
                        {item.barcode && <div className="text-[10px] text-gray-400 font-mono mt-0.5 ml-3">{item.barcode}</div>}
                        {!isVariant && (
                          <div className="text-[10px] text-indigo-500 font-semibold mt-1">
                            {product.productType || 'SIMPLE'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={getDisplayValue(item, 'purchasePrice')}
                          onChange={(e) => handleEdit(item.id, 'purchasePrice', e.target.value)}
                          className={`w-24 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            editedProducts[item.id]?.purchasePrice !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={getDisplayValue(item, 'mrp')}
                          onChange={(e) => handleEdit(item.id, 'mrp', e.target.value)}
                          className={`w-24 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            editedProducts[item.id]?.mrp !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={getDisplayValue(item, 'salePrice')}
                          onChange={(e) => handleEdit(item.id, 'salePrice', e.target.value)}
                          className={`w-24 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            editedProducts[item.id]?.salePrice !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={getDisplayValue(item, 'stock')}
                          onChange={(e) => handleEdit(item.id, 'stock', e.target.value)}
                          disabled={!isVariant && product.productType === 'SERVICE'}
                          className={`w-20 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            (!isVariant && product.productType === 'SERVICE') ? 'bg-gray-100 cursor-not-allowed opacity-50' :
                            editedProducts[item.id]?.stock !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                    </tr>
                  );

                  const rows = [];
                  if (['BATCH', 'SERIAL'].includes(product.productType)) {
                    rows.push(
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                          <div className="truncate max-w-[200px] sm:max-w-[300px]">{product.name}</div>
                          <div className="text-[10px] text-indigo-500 font-semibold mt-1">{product.productType}</div>
                        </td>
                        <td colSpan={4} className="px-6 py-3 text-center text-sm text-gray-500 bg-gray-50/50">
                          Complex product. Please <a href={`/products/${product.id}/edit`} className="text-indigo-600 font-medium hover:underline">edit individually</a> to manage batches or serials.
                        </td>
                      </tr>
                    );
                  } else if (product.productType === 'VARIANT' && product.variants?.length > 0) {
                    rows.push(
                      <tr key={`${product.id}-header`} className="bg-gray-50/50 border-b-0">
                        <td colSpan={5} className="px-6 py-2 text-sm text-gray-900 font-semibold border-b border-gray-100">
                          {product.name}
                        </td>
                      </tr>
                    );
                    product.variants.forEach((v: any) => {
                      rows.push(renderRow(v, true, product.name));
                    });
                  } else {
                    rows.push(renderRow(product));
                  }

                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
