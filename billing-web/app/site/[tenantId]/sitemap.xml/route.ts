import { NextRequest } from 'next/server';
import { resolveTenant, getWebsiteConfig, getTenantSiteUrl } from '@/lib/website/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const tenant = await resolveTenant(tenantId);

  if (!tenant) {
    return new Response('Not found', { status: 404 });
  }

  const config = getWebsiteConfig(tenant);
  const siteId = getTenantSiteUrl(tenant);
  const base = `${new URL(request.url).origin}/site/${siteId}`;

  const paths = ['', ...(config.pages?.about !== false ? ['/about'] : []), ...(config.pages?.shop !== false ? ['/shop'] : []), ...(config.pages?.contact !== false ? ['/contact'] : [])];

  const urls = paths.map((path) => `  <url>\n    <loc>${base}${path}</loc>\n  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
