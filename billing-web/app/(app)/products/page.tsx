"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getFilteredProducts, getProductCategories } from '@/lib/actions/products';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch products with optional search and category filter
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const results = await getFilteredProducts(searchTerm, categoryFilter);
      setProducts(results);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch distinct categories for filter dropdown
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

  // Run initial fetch
  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter]);

  if (loading) {
    return (
      <div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Loading products...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <div className="flex space-x-3">
          <Link href="/products/add" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add New Product
          </Link>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
            }}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              id="product-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or barcode..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="text-sm font-medium text-gray-700 mb-2 block hidden md:block">
              Show Low Stock Only
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="low-stock"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="low-stock" className="text-sm font-medium text-gray-700">
                Stock &lt; 10
              </label>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No products found matching the filters.</p>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    Barcode: {product.barcode || 'N/A'}
                  </p>
                  <div className="mt-2 space-x-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      ${product.mrp.toFixed(2)} MRP
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      ${product.salePrice.toFixed(2)} Sale
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      ${product.purchasePrice.toFixed(2)} Cost
                    </span>
                  </div>
                  {product.category && (
                    <p className="mt-1 text-xs text-gray-500">
                      Category: {product.category}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-medium">
                    Stock: 
                    <span className={`
                      ${product.stock <= 5 ? 'text-red-600 font-bold' : 
                        product.stock <= 10 ? 'text-yellow-600' : 
                        'text-green-600'}
                    `}>
                      {product.stock}
                    </span>
                    {product.stock <= 5 && (
                      <span className="ml-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        LOW
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-x-2">
                  <Link 
                    href={`/products/${product.id}`} 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View
                  </Link>
                  <Link 
                    href={`/products/${product.id}/edit`} 
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}