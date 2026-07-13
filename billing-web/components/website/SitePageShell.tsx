'use client';

import React, { Suspense } from 'react';
import { WebsiteConfig } from '@/lib/website/types';
import { themeNavbars, themeFooters } from '@/lib/website/registry';
import VisitTracker from './VisitTracker';

export default function SitePageShell({ config, tenant, children }: { config: WebsiteConfig; tenant: any; children: React.ReactNode; }) {
  const Navbar = themeNavbars[config.theme] || themeNavbars['modern-restaurant'];
  const Footer = themeFooters[config.theme] || themeFooters['modern-restaurant'];
  const footerSection = config.sections?.find(s => s.type === 'footer');

  return (
    <>
      <VisitTracker tenantId={tenant.id} pageTitle={config.seo?.metaTitle || tenant.name} />
      <div
        className="min-h-screen flex flex-col"
        style={{
        backgroundColor: config.appearance?.colors?.background || '#FAF9F5',
        color: config.appearance?.colors?.text || '#1F2937',
        '--theme-primary': config.appearance?.colors?.primary || '#EAB308',
        '--theme-secondary': config.appearance?.colors?.secondary || '#6b7280',
        '--theme-background': config.appearance?.colors?.background || '#FAF9F5',
        '--theme-text': config.appearance?.colors?.text || '#1F2937',
      } as React.CSSProperties}
    >
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse" />}>
        <Navbar tenant={tenant} config={config} />
      </Suspense>
      <main className="flex-grow">
        {children}
      </main>
      <Suspense fallback={null}>
        <Footer data={(footerSection as any)?.data || { copyrightText: `© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.`, showSocialLinks: true }} config={config} tenant={tenant} />
      </Suspense>
    </div>
    </>
  );
}
