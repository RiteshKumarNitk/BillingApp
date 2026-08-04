"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root-level error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center font-sans">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Something went wrong</h1>
          <p className="max-w-sm text-sm text-gray-500">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
