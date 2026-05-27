"use client";

import { Printer } from 'lucide-react';

export default function PrintInvoiceButton() {
  return (
    <div className="mt-10 flex justify-center print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
      >
        <Printer className="w-5 h-5" />
        Print Invoice
      </button>
    </div>
  );
}
