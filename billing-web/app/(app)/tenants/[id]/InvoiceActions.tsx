"use client";

import { useState } from "react";
import { markInvoiceAsPaid } from "@/lib/actions/subscription";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InvoiceActions({ invoiceId, status }: { invoiceId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkPaid = async () => {
    if (!confirm("Are you sure you want to mark this invoice as paid?")) return;
    setLoading(true);
    try {
      await markInvoiceAsPaid(invoiceId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {status !== "PAID" && (
        <button
          onClick={handleMarkPaid}
          disabled={loading}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50 text-xs font-semibold"
        >
          <Check className="w-3.5 h-3.5" />
          {loading ? "..." : "Mark Paid"}
        </button>
      )}
      <a 
        href={`/admin/invoices/${invoiceId}/print`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition-colors text-xs font-semibold"
      >
        View Receipt
      </a>
    </div>
  );
}
