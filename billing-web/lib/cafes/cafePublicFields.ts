// Shared by every mobile-customer route that lists or details a cafe (Tenant), so the public
// per-cafe shape (and the distance math used for "nearby") only exists in one place.

export const cafePublicSelect = {
  id: true,
  name: true,
  websiteSlug: true,
  tagline: true,
  logoUrl: true,
  coverImageUrl: true,
  address: true,
  latitude: true,
  longitude: true,
  businessHours: true,
  // Tenant.primaryColor/fontFamily are dead legacy fields never touched by the Website Builder save
  // route — the real per-cafe branding lives in Website.appearance (the Theme Engine).
  websiteSettings: { select: { theme: true, appearance: true } },
} as const;

export interface PublicCafeSource {
  websiteSettings: { theme: string | null; appearance: unknown } | null;
  [key: string]: unknown;
}

export function toPublicCafe<T extends PublicCafeSource>(t: T) {
  const { websiteSettings, ...rest } = t;
  return {
    ...rest,
    theme: websiteSettings?.theme ?? null,
    appearance: websiteSettings?.appearance ?? null,
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
