"use client";

import React from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import ThemeLayoutShell from './engine/ThemeLayoutShell';
import VisitTracker from './VisitTracker';

// Home/Shop entry point. Both now render through the same ThemeLayoutShell — a theme is just a
// ThemeDefinition (lib/website/themeDefinitions.ts) plus shared engine components, not its own
// Layout.tsx. Footer visibility here follows config.sections' footer entry's isVisible flag, same
// as every other section (see ThemeLayoutShell) — distinct from SitePageShell's About/Contact
// chrome, which always shows a footer regardless of isVisible (existing, intentionally preserved
// behavior — see SitePageShell.tsx).
export default function WebsiteRenderer({ config, tenant, children, trackVisit = true }: { config: WebsiteConfig, tenant: any, children?: React.ReactNode, trackVisit?: boolean }) {
  return (
    <>
      {trackVisit && <VisitTracker tenantId={tenant.id} pageTitle={config.seo?.metaTitle || tenant.name} />}
      <ThemeLayoutShell config={config} tenant={tenant}>
        {children}
      </ThemeLayoutShell>
    </>
  );
}
