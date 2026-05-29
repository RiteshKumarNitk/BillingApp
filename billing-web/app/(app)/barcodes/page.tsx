"use client";

import { useState, useCallback, useEffect } from 'react';
import { searchProducts } from '@/lib/actions/products';
import { useToast } from '@/components/ui/Toast';
import { Search, Printer, Plus, Minus, Trash2, Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface PrintItem {
  id: string; // unique queue id
  productId: string;
  variantId?: string;
  name: string;
  barcode: string;
  price: number;
  printQuantity: number;
}

export default function BarcodePrintPage() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    try {
      const results = await searchProducts(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', 'Failed to search products');
    } finally {
      setIsSearching(false);
    }
  }, [addToast]);

  useEffect(() => {
    handleSearch('');
  }, [handleSearch]);

  const addToQueue = (product: any, variant?: any) => {
    const barcode = variant ? variant.barcode : product.barcode;
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    const price = variant ? variant.salePrice : product.salePrice;

    if (!barcode) {
      addToast('error', `No barcode available for ${name}`);
      return;
    }

    const newItem: PrintItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      variantId: variant?.id,
      name,
      barcode,
      price,
      printQuantity: 1
    };

    setPrintQueue(prev => [...prev, newItem]);
    addToast('success', `Added ${name} to print queue`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setPrintQueue(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.printQuantity + delta);
        return { ...item, printQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromQueue = (id: string) => {
    setPrintQueue(prev => prev.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    if (printQueue.length === 0) {
      addToast('error', 'Add items to the queue first');
      return;
    }

    const totalLabels = printQueue.reduce((sum, item) => sum + item.printQuantity, 0);
    if (totalLabels > 100) {
      if (!confirm(`You are about to print ${totalLabels} labels. This might take a few pages. Continue?`)) {
        return;
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate HTML for labels
    let labelsHtml = '';
    printQueue.forEach(item => {
      for (let i = 0; i < item.printQuantity; i++) {
        // We use an SVG tag that JsBarcode will target
        labelsHtml += `
          <div class="label-container">
            <div class="product-name">${item.name}</div>
            <div class="product-price">₹${item.price.toFixed(2)}</div>
            <svg class="barcode-svg" data-barcode="${item.barcode}"></svg>
          </div>
        `;
      }
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .grid {
              display: flex;
              flex-wrap: wrap;
              gap: 4mm;
              align-content: flex-start;
            }
            .label-container {
              width: 50mm;
              height: 30mm;
              border: 1px dashed #ccc; /* Guide lines for cutting/stickers */
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2mm;
              overflow: hidden;
            }
            .product-name {
              font-size: 8px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              margin-bottom: 1mm;
            }
            .product-price {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .barcode-svg {
              width: 100%;
              height: 15mm;
            }
            @media print {
              .label-container {
                border: none; /* Hide border when printing if using pre-cut sheets */
                /* Adjust width/height if using specific A4 sticker templates */
              }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${labelsHtml}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            // Initialize all barcodes
            document.querySelectorAll('.barcode-svg').forEach(function(svg) {
              var barcodeVal = svg.getAttribute('data-barcode');
              JsBarcode(svg, barcodeVal, {
                format: "code128",
                lineColor: "#000",
                width: 1.5,
                height: 40,
                displayValue: true,
                fontSize: 10,
                margin: 0
              });
            });
            
            // Print automatically once rendered
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // setTimeout(() => window.close(), 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-theme(spacing.16))]">
      
      {/* Left Panel: Search & Add */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Tag className="w-6 h-6 text-indigo-600" />
            Barcode Generator
          </h1>
          <p className="text-sm text-gray-500 mb-6">Search products to add them to the print queue.</p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or scan barcode..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="flex justify-center p-8 text-gray-400">Searching...</div>
          ) : searchResults.length === 0 && searchTerm ? (
            <div className="text-center p-8 text-gray-500">No products found</div>
          ) : (
            <div className="space-y-2 p-4">
              {searchResults.map((product) => (
                <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-indigo-600 font-medium">{product.productType}</p>
                    </div>
                  </div>
                  
                  {/* Master Barcode Add */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Master Barcode</p>
                      <p className="text-xs text-gray-500 font-mono">{product.barcode || 'No barcode set'}</p>
                    </div>
                    <button
                      onClick={() => addToQueue(product)}
                      disabled={!product.barcode}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-600 shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* Variants Barcode Add */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Selling Variants</p>
                      {product.variants.map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-indigo-50/30 rounded-lg border border-indigo-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{v.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{v.barcode || 'No barcode set'}</p>
                          </div>
                          <button
                            onClick={() => addToQueue(product, v)}
                            disabled={!v.barcode}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-600 shadow-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Print Queue */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Print Queue</h2>
            <p className="text-sm text-gray-500">{printQueue.reduce((sum, item) => sum + item.printQuantity, 0)} total labels</p>
          </div>
          <button
            onClick={handlePrint}
            disabled={printQueue.length === 0}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-5 h-5" />
            Print Labels
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {printQueue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Printer className="w-16 h-16 mb-4 text-gray-300" />
              <p>Your print queue is empty.</p>
              <p className="text-sm mt-1">Search and add products from the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {printQueue.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{item.barcode}</p>
                      <p className="text-xs font-medium text-green-600">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.printQuantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromQueue(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
