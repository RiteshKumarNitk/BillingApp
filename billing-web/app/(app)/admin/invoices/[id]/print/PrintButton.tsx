"use client";

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
    >
      <Printer className="w-4 h-4" /> Print / Save as PDF
    </button>
  );
}
