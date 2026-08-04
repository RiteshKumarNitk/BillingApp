"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App section error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-rose-50 p-3">
        <AlertTriangle className="h-6 w-6 text-rose-600" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-1 text-sm text-gray-500">
          This page ran into an unexpected error. You can try again, or head back to the dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
