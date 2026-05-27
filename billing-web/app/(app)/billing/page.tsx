"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchProducts } from '@/lib/actions/products';

export default function BillingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce timer for search
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch products based on search term with debounce
  const fetchProducts = async () => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchProducts(searchTerm);
      setProducts(results);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Update search term with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms debounce

    setDebounceTimer(timer);
  };

  // Add item to cart
  const addToCart = (product: any) => {
    // Check if item already in cart
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity
      const newCart = [...cart];
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newCart[existingItemIndex].quantity + 1,
        itemTotal: parseFloat((newCart[existingItemIndex].quantity + 1) * newCart[existingItemIndex].salePrice).toFixed(2)
      };
      setCart(newCart);
    } else {
      // Add new item
      const newItem = {
        id: Math.random().toString(36).substr(2, 9), // Temporary ID
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchasePrice,
        mrp: product.mrp,
        salePrice: product.salePrice, // Default sale price, editable
        quantity: 1,
        itemTotal: product.salePrice
      };
      setCart([...cart, newItem]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Update quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          itemTotal: parseFloat((quantity * item.salePrice)).toFixed(2)
        };
      }
      return item;
    });
    setCart(newCart);
  };

  // Update sale price
  const updateSalePrice = (itemId: string, salePrice: number) => {
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          salePrice,
          itemTotal: parseFloat((item.quantity * salePrice)).toFixed(2)
        };
      }
      return item;
    });
    setCart(newCart);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.itemTotal), 0);
  const discountAmount = (subtotal * discount) / 100;
  const netAmount = subtotal - discountAmount;

  // Handle bill submission
  const handleSubmit = async () => {
    if (cart.length === 0) {
      setSubmitError('Please add items to the cart before submitting');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      // Prepare items for API request
      const itemsToSend = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice
      }));

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToSend,
          discount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create bill');
      }

      // Redirect to bill preview page
      router.push(`/billing/${data.transaction.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the bill');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Bill</h1>
        <p className="text-gray-600">Search for items and add them to the bill</p>
      </header>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search and Product List */}  
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Items
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Type item name or barcode..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {searchLoading && !products.length && (
              <p className="text-center text-gray-500">Searching...</p>
            )}

            {!searchLoading && products.length === 0 && searchTerm && (
              <p className="text-center text-gray-500">No products found</p>
            )}

            {!searchLoading && products.length > 0 && (
              <ul className="space-y-2">
                {products.map(product => (
                  <li key={product.id} className="bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">Barcode: {product.barcode}</p>
                        <p className="text-sm text-gray-500">
                          MRP: ${product.mrp.toFixed(2)} | 
                          Sale Price: ${product.salePrice.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Middle Column: Cart */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cart</h2>
              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-4">No items in cart</p>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Barcode: {item.barcode}</p>
                      </div>
                      <div className="space-x-2">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity === 1}
                            className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          R
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="space-x-3">
                        <label className="text-sm font-medium text-gray-700">Sale Price:</label>
                        <input
                          type="number"
                          value={item.salePrice}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateSalePrice(item.id, value);
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(item.itemTotal).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Order Summary */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Order Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount (%):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setDiscount(value);
                    }}
                    className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Net Amount:</span>
                  <span>${netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitLoading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Creating Bill...' : cart.length === 0 ? 'Empty Cart' : 'Create Bill'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}