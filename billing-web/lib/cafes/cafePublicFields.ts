// Shared by every mobile-customer route that lists or details a cafe (Tenant), so the public
// per-cafe shape (and the distance math used for "nearby") only exists in one place.
import { pickHeroImage } from './heroImage';

export const cafePublicSelect = {
  id: true,
  name: true,
  websiteSlug: true,
  tagline: true,
  logoUrl: true,
  coverImageUrl: true,
  shopFrontImageUrl: true,
  ownerImageUrl: true,
  address: true,
  latitude: true,
  longitude: true,
  businessHours: true,
  aboutText: true,
  email: true,
  phone: true,
  // Tenant.primaryColor/fontFamily are dead legacy fields never touched by the Website Builder save
  // route — the real per-cafe branding lives in Website.appearance (the Theme Engine).
  // `sections` is selected only to compute heroImageUrl's gallery-first-image fallback below — it
  // is deliberately stripped back out in toPublicCafe(), not re-exposed as raw section JSON.
  websiteSettings: { select: { theme: true, appearance: true, sections: true } },
} as const;

export interface PublicCafeSource {
  websiteSettings: { theme: string | null; appearance: unknown; sections?: unknown } | null;
  coverImageUrl?: string | null;
  shopFrontImageUrl?: string | null;
  [key: string]: unknown;
}

export interface GalleryImage {
  url: string;
  caption: string | null;
}

export function getGalleryImages(sections: unknown): GalleryImage[] {
  if (!Array.isArray(sections)) return [];
  const gallery = sections.find((s: any) => s?.type === 'gallery');
  const images = gallery?.data?.images;
  if (!Array.isArray(images)) return [];
  return images
    .filter((img: any) => typeof img?.url === 'string')
    .map((img: any) => ({ url: img.url, caption: typeof img.caption === 'string' ? img.caption : null }));
}

export function toPublicCafe<T extends PublicCafeSource>(t: T) {
  const { websiteSettings, ...rest } = t;
  const galleryImages = getGalleryImages(websiteSettings?.sections);
  return {
    ...rest,
    theme: websiteSettings?.theme ?? null,
    appearance: websiteSettings?.appearance ?? null,
    heroImageUrl: pickHeroImage({
      coverImageUrl: t.coverImageUrl,
      shopFrontImageUrl: t.shopFrontImageUrl,
      galleryFirstImageUrl: galleryImages[0]?.url ?? null,
    }),
  };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
