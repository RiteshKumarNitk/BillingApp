"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Customer section error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-rose-50 p-3">
        <AlertTriangle className="h-6 w-6 text-rose-600" />
      </div>
      <div>
        <h2 className="text-lg font-black text-[#2D2D2D]">Something went wrong</h2>
        <p className="mt-1 text-sm text-gray-500">
          This page ran into an unexpected error. You can try again, or go back to your dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FFE11B] px-4 py-2 text-sm font-bold text-[#2D2D2D] shadow-sm hover:brightness-95 transition-all"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="/customer"
          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#2D2D2D] shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
