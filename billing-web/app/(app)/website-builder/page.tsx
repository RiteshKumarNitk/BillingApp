import React from 'react';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { WebsiteConfig } from '@/lib/website/types';
import { getThemeDefaultConfig, DEFAULT_THEME_ID } from '@/lib/website/themeDefinitions';
import { getThemesForBusinessType } from '@/lib/website/registry';
import { getActiveSubscription, DEFAULT_STARTER_THEMES } from '@/lib/subscription';
import WebsiteBuilderClient from './WebsiteBuilderClient';

export const metadata = {
  title: 'Website Builder | BillingApp',
};

export default async function WebsiteBuilderPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>Only the store owner can access the Website Builder.</p>
        </div>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    include: {
      websiteSettings: true,
      products: { include: { variants: true }, where: { stock: { gt: -1 } } }
    }
  });

  if (!tenant) return null;

  const activeSub = await getActiveSubscription(tenant.id);
  const allowedThemes = activeSub?.allowedThemes ?? DEFAULT_STARTER_THEMES;

  let config: WebsiteConfig = (tenant.websiteSettings as unknown as WebsiteConfig);

  if (!config || !config.sections || config.sections.length < 3) {
    const defaultThemeId = getThemesForBusinessType(tenant.businessType)[0]?.id || DEFAULT_THEME_ID;
    config = getThemeDefaultConfig(defaultThemeId, tenant);
  }

  return (
    <div className="h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 -my-4 sm:-my-6 flex flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Website Builder</h1>
          <p className="text-sm text-gray-500">Design and manage your public website</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/site/${tenant.websiteSlug || tenant.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            View Live Site
          </a>
        </div>
      </div>

      <WebsiteBuilderClient
        initialConfig={config}
        tenantId={tenant.id}
        tenantWebsiteSlug={tenant.websiteSlug || tenant.id}
        tenant={tenant}
        allowedThemes={allowedThemes}
        initialAboutInfo={{
          tagline: tenant.tagline || '',
          aboutText: tenant.aboutText || '',
          coverImageUrl: tenant.coverImageUrl || '',
          businessHours: tenant.businessHours || '',
        }}
      />
    </div>
  );
}
