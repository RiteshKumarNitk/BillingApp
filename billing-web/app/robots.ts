import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Tenant dashboards, auth flows, and API routes are never meant to be indexed — only the
        // marketing site (this file's scope) and public tenant storefronts (which have their own
        // per-tenant robots.txt under app/site/[tenantId]/robots.txt) should be crawlable.
        disallow: ["/dashboard", "/billing", "/products", "/settings", "/api/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
