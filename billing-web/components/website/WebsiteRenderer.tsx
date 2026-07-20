"use client";

import React, { Suspense } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import { getThemeLayout } from '@/lib/website/registry';
import VisitTracker from './VisitTracker';

export default function WebsiteRenderer({ config, tenant, children, trackVisit = true }: { config: WebsiteConfig, tenant: any, children?: React.ReactNode, trackVisit?: boolean }) {
  const ThemeLayout = getThemeLayout(config.theme);

  return (
    <>
      {trackVisit && <VisitTracker tenantId={tenant.id} pageTitle={config.seo?.metaTitle || tenant.name} />}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading website...</div>}>
        <ThemeLayout config={config} tenant={tenant}>
          {children}
        </ThemeLayout>
      </Suspense>
    </>
  );
}
