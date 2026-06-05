"use client";

import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrintInvoiceButton() {
  return (
    <div className="flex items-center justify-center gap-3 print:hidden">
      <Link
        href="/billing"
        className="px-5 py-2.5 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        New Bill
      </Link>
      <button
        onClick={() => window.print()}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <Printer className="w-4 h-4" />
        Print Invoice
      </button>
    </div>
  );
}
