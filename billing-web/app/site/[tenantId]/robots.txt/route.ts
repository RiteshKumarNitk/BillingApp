import { NextRequest } from 'next/server';
import { resolveTenant, getTenantSiteUrl } from '@/lib/website/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);

  if (!tenant) {
    return new Response('Not found', { status: 404 });
  }

  const siteId = getTenantSiteUrl(tenant);
  const origin = new URL(request.url).origin;

  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/site/${siteId}/sitemap.xml\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
