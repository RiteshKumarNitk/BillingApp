'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker({ tenantId, pageTitle }: { tenantId: string; pageTitle?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/website/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        path: pathname,
        referrer: document.referrer || null,
        pageTitle: pageTitle || document.title
      })
    }).catch(() => {});
  }, [tenantId, pathname, pageTitle]);

  return null;
}
