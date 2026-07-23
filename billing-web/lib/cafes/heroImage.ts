// The one place the "which image represents this cafe" priority order lives — used by both the
// mobile customer API (cafePublicFields.ts) and the public website (Hero.tsx's luxury variant,
// AboutContent.tsx) so a tenant who only ever uploaded a Shop Front photo still gets a real hero
// image everywhere instead of an empty box in some places and not others.
export function pickHeroImage(source: {
  coverImageUrl?: string | null;
  shopFrontImageUrl?: string | null;
  galleryFirstImageUrl?: string | null;
}): string | null {
  return source.coverImageUrl || source.shopFrontImageUrl || source.galleryFirstImageUrl || null;
}
