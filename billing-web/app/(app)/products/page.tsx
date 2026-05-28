"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getFilteredProducts, getProductCategories } from '@/lib/actions/products';
import { Package, Search, ChevronLeft, ChevronRight, X, Barcode } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getFilteredProducts(searchTerm, categoryFilter, lowStockOnly, page, ITEMS_PER_PAGE);
      setProducts(results.products);
      setTotal(results.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, lowStockOnly, page]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const distinctCategories = await getProductCategories();
        setCategories(distinctCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{total} product{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/add" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
            <Package className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or barcode..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-gray-900 text-sm appearance-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 font-medium">Low Stock</span>
          </label>
          {(searchTerm || categoryFilter || lowStockOnly) && (
            <button
              onClick={() => { setSearchTerm(''); setCategoryFilter(''); setLowStockOnly(false); }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium inline-flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-200 rounded w-64" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new product.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      {product.barcode ? <Barcode className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.category && (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {product.category}
                          </span>
                        )}
                      </div>
                      {product.barcode && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">#{product.barcode}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">₹{product.salePrice.toFixed(2)}</span>
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-medium line-through">₹{product.mrp.toFixed(2)}</span>
                        {product.purchasePrice > 0 && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Cost ₹{product.purchasePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm flex items-center gap-1.5">
                        <span className="text-gray-500">Stock:</span>
                        <span className={`font-bold ${
                          product.stock <= 5 ? 'text-red-600' :
                          product.stock <= (product.minStockThreshold || 10) ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {product.stock} {product.unit || 'pcs'}
                        </span>
                        {product.stock <= (product.minStockThreshold || 10) && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {product.stock <= 5 ? 'CRITICAL' : 'LOW'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Link href={`/products/${product.id}`} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">View →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-400">...</span>}
                      <button onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
