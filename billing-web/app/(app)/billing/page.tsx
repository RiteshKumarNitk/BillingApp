"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchProducts } from '@/lib/actions/products';
import { useToast } from '@/components/ui/Toast';
import { Search, Camera, Plus, Minus, Trash2, Barcode, X, ShoppingCart, AlertCircle } from 'lucide-react';
import ProductSelectionModal from './ProductSelectionModal';

export default function BillingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<number | null>(null);

  const [selectedComplexProduct, setSelectedComplexProduct] = useState<any>(null);

  const fetchProducts = useCallback(async (term: string) => {
    setSearchLoading(true);
    try {
      const results = await searchProducts(term);
      setProducts(results);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts('');
  }, [fetchProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchProducts(value);
  };

  const handleBarcodeSearch = async () => {
    const barcode = barcodeInput.trim();
    if (!barcode) return;
    setSearchTerm(barcode);
    await fetchProducts(barcode);
    setBarcodeInput('');
    searchRef.current?.focus();
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch();
    }
  };

  const addToCart = (product: any) => {
    if (product.stock <= 0 && product.productType !== 'SERVICE') {
      addToast('error', `${product.name} is out of stock!`);
      return;
    }

    if (['VARIANT', 'BATCH', 'SERIAL', 'WEIGHT'].includes(product.productType)) {
      setSelectedComplexProduct(product);
      return;
    }

    // Direct add for SIMPLE and SERVICE
    confirmAddToCart(product, {
      quantity: 1,
      salePrice: product.salePrice,
      titleOverride: product.name,
      purchasePrice: product.purchasePrice,
      mrp: product.mrp
    });
  };

  const confirmAddToCart = (product: any, selectionData: any) => {
    const { 
      variantId, batchId, serialId, quantity, salePrice, 
      titleOverride, purchasePrice, mrp 
    } = selectionData;

    // For Serials, they are unique, so we don't group them
    const existingItemIndex = product.productType === 'SERIAL' ? -1 : cart.findIndex(item => 
      item.productId === product.id && 
      item.variantId === variantId && 
      item.batchId === batchId
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      const newQty = newCart[existingItemIndex].quantity + quantity;
      
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newQty,
        itemTotal: (newQty * newCart[existingItemIndex].salePrice).toFixed(2)
      };
      setCart(newCart);
      addToast('success', `${titleOverride} quantity updated`);
    } else {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        name: titleOverride || product.name,
        barcode: product.barcode,
        purchasePrice: purchasePrice || product.purchasePrice,
        mrp: mrp || product.mrp,
        salePrice: salePrice || product.salePrice,
        quantity: quantity,
        itemTotal: ((salePrice || product.salePrice) * quantity).toFixed(2),
        maxStock: product.stock,
        stock: product.stock,
        variantId,
        batchId,
        serialId,
        productType: product.productType
      };
      setCart([...cart, newItem]);
      addToast('success', `${newItem.name} added to cart`);
    }
    
    setSelectedComplexProduct(null);
  };

  const removeFromCart = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) addToast('info', `${item.name} removed from cart`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    if (quantity < 1) return;
    if (quantity > item.stock) {
      addToast('error', `Only ${item.stock} units available`);
      return;
    }

    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          itemTotal: (quantity * item.salePrice).toFixed(2)
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const updateSalePrice = (itemId: string, salePrice: number) => {
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          salePrice,
          itemTotal: (item.quantity * salePrice).toFixed(2)
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    addToast('info', 'Cart cleared');
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.itemTotal), 0);
  const discountAmount = (subtotal * discount) / 100;
  const netAmount = subtotal - discountAmount;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setSubmitError('Please add items to the cart before submitting');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const itemsToSend = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice,
        variantId: item.variantId,
        batchId: item.batchId,
        serialId: item.serialId,
        titleOverride: item.name,
        purchasePrice: item.purchasePrice,
        mrp: item.mrp,
        productType: item.productType
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

      addToast('success', 'Bill created successfully!');
      router.push(`/billing/${data.transaction.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the bill');
      addToast('error', err.message || 'Failed to create bill');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startCameraScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanBarcode();
      }
    } catch (err) {
      addToast('error', 'Camera access denied. Please use manual barcode input.');
      setScanning(false);
    }
  };

  const scanBarcode = () => {
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
      const detect = async () => {
        if (!videoRef.current || !scanning) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopCamera();
            setBarcodeInput(code);
            setSearchTerm(code);
            await fetchProducts(code);
            addToast('success', `Scanned: ${code}`);
          }
        } catch (e) {
        }
        scannerRef.current = window.setTimeout(detect, 500);
      };
      detect();
    } else {
      addToast('info', 'Barcode scanner not supported in this browser. Try Chrome on Android.');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      clearTimeout(scannerRef.current);
      scannerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) clearTimeout(scannerRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Bill</h1>
          <p className="text-gray-600">Search or scan items and add them to the bill</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+K</kbd>
          <span>Focus search</span>
        </div>
      </header>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {submitError}
          <button onClick={() => setSubmitError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {/* Barcode Scanner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Barcode className="w-4 h-4 inline mr-1" />
                Scan Barcode
              </label>
              <div className="flex gap-2">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Enter barcode..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                />
                <button
                  onClick={handleBarcodeSearch}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title="Search barcode"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={startCameraScan}
                  disabled={scanning}
                  className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors disabled:opacity-50"
                  title="Scan with camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Camera Preview */}
            {scanning && (
              <div className="relative rounded-md overflow-hidden border border-indigo-300">
                <video ref={videoRef} autoPlay className="w-full h-40 object-cover" />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Scanning...
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search Items
              </label>
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Type item name or barcode..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
              <ul className="space-y-2 max-h-[calc(100vh-28rem)] overflow-y-auto">
                {products.map(product => (
                  <li
                    key={product.id}
                    className={`p-3 rounded-md border transition-colors cursor-pointer
                      ${product.stock <= 0 ? 'bg-red-50 border-red-200 opacity-60' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                    `}
                    onClick={() => product.stock > 0 && addToCart(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">Barcode: {product.barcode}</p>
                        <div className="flex gap-3 text-sm text-gray-500 mt-1">
                          <span>MRP: ₹{product.mrp.toFixed(2)}</span>
                          <span className="text-green-600 font-medium">₹{product.salePrice.toFixed(2)}</span>
                        </div>
                        <span className={`inline-flex items-center mt-1 text-xs font-medium px-2 py-0.5 rounded-full
                          ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {product.stock} in stock
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); product.stock > 0 && addToCart(product); }}
                        disabled={product.stock <= 0}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ml-2 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Cart
                {cart.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">({totalItems} items)</span>
                )}
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-3" />
                <p className="text-sm">No items in cart</p>
                <p className="text-xs mt-1">Search products or scan barcodes to add items</p>
              </div>
            )}

            {cart.length > 0 && (
              <div className="space-y-3 max-h-[calc(100vh-24rem)] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 truncate">Barcode: {item.barcode}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 ml-2 shrink-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity === 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <input
                            type="number"
                            value={item.salePrice}
                            onChange={(e) => updateSalePrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                        <span className="font-semibold text-gray-900 min-w-[5rem] text-right">
                          ₹{parseFloat(item.itemTotal).toFixed(2)}
                        </span>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600 pb-3 border-b border-gray-100">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="pb-3 border-b border-gray-100">
                <label className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Discount (%)</span>
                  <span className="text-xs text-gray-400">0 - 100</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">{discount}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Discount: -₹{discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Net Amount</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitLoading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating Bill...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Create Bill
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400">
                {cart.length === 0 ? 'Cart is empty' : `${cart.length} items · ₹${netAmount.toFixed(2)} total`}
              </p>
            </div>
          </div>
        </section>
      </div>
      {selectedComplexProduct && (
        <ProductSelectionModal
          product={selectedComplexProduct}
          onClose={() => setSelectedComplexProduct(null)}
          onConfirm={(data) => confirmAddToCart(selectedComplexProduct, data)}
        />
      )}
    </div>
  );
}
