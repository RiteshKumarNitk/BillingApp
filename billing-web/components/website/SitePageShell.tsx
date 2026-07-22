'use client';

import React from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import { getThemeDefinition } from '@/lib/website/themeDefinitions';
import NavbarShell from './engine/NavbarShell';
import FooterShell from './engine/FooterShell';
import VisitTracker from './VisitTracker';

// About/Contact page chrome. Built on the same NavbarShell/FooterShell primitives as
// ThemeLayoutShell (used by Home/Shop via WebsiteRenderer) — the CSS-var setup and per-theme
// dynamic-import lookups that used to be duplicated between this file and every theme's Layout.tsx
// are gone. Footer here always renders with a synthesized default if the tenant has no footer
// section saved (and ignores isVisible) — that's existing behavior, preserved as-is; Home/Shop's
// footer instead follows the footer section's isVisible flag like any other section (see
// ThemeLayoutShell). This intentional difference predates this refactor and isn't changed here.
export default function SitePageShell({ config, tenant, children }: { config: WebsiteConfig; tenant: any; children: React.ReactNode; }) {
  const def = getThemeDefinition(config.theme);
  const defaults = def.defaultAppearance;
  const footerSection = config.sections?.find((s) => s.type === 'footer');
  const footerData = (footerSection as any)?.data || { copyrightText: `© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.`, showSocialLinks: true };

  const primaryColor = config.appearance?.colors?.primary || defaults.colors?.primary;
  const backgroundColor = config.appearance?.colors?.background || defaults.colors?.background;
  const textColor = config.appearance?.colors?.text || defaults.colors?.text;

  return (
    <>
      <VisitTracker tenantId={tenant.id} pageTitle={config.seo?.metaTitle || tenant.name} />
      <div
        className="site-shell min-h-screen flex flex-col"
        style={{
          backgroundColor,
          color: textColor,
          '--theme-primary': primaryColor,
          '--theme-secondary': config.appearance?.colors?.secondary || defaults.colors?.secondary,
          '--theme-accent': config.appearance?.colors?.accent || defaults.colors?.accent || primaryColor,
          '--theme-background': backgroundColor,
          '--theme-font-heading': config.appearance?.typography?.headingFont || defaults.typography?.headingFont || undefined,
          '--theme-font-body': config.appearance?.typography?.bodyFont || defaults.typography?.bodyFont || undefined,
        } as React.CSSProperties}
      >
        <NavbarShell tenant={tenant} config={config} variant={config.appearance?.navStyle || defaults.navStyle} />
        <main className="flex-grow">{children}</main>
        <FooterShell data={footerData} config={config} tenant={tenant} variant={def.sectionVariants.footer as any} />
      </div>
    </>
  );
}
