import type { Metadata } from "next";

// No production domain is configured anywhere in this repo yet — set NEXT_PUBLIC_SITE_URL when
// one exists. Falling back to localhost keeps `metadataBase`-derived OG/Twitter image URLs valid
// in dev without silently pointing at a domain nobody owns.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = "CafeOS";
export const SITE_TAGLINE = "The Complete Cafe Management Platform";

export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === "/" ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
