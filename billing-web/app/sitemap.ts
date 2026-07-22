import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/seo";

const MARKETING_PATHS = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/website-themes", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/qr-ordering", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/pos", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/kitchen-display", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/online-ordering", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return MARKETING_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
