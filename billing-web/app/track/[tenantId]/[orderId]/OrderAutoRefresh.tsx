"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-renders the order status page on an interval while the order is still in progress. Pauses
// while the tab is hidden so a forgotten background tab doesn't keep polling the server.
export default function OrderAutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
