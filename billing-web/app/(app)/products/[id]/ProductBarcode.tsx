"use client";

import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer } from 'lucide-react';

interface ProductBarcodeProps {
  barcode: string;
  name: string;
}

export default function ProductBarcode({ barcode, name }: ProductBarcodeProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <svg id="barcode"></svg>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${barcode}", {
              format: "code128",
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true
            });
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          Barcode & Labels
        </h2>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Label
        </button>
      </div>
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        <Barcode value={barcode} format="CODE128" />
        <p className="text-xs text-gray-500 mt-2">Format: CODE128</p>
      </div>
    </div>
  );
}
