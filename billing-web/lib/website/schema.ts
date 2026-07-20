import { z } from 'zod';

// Matches the `id` values in lib/website/registry.ts's `themes` array. Kept as a plain literal list
// here (rather than importing registry.ts) because that module pulls in next/dynamic component
// wrappers meant for client rendering, not for a server-only validator.
const THEME_IDS = ['modern-restaurant', 'fashion-store', 'premium-food', 'fresh-harvest', 'organic-grove', 'fruit-fresh'] as const;

const url = z.string().trim().max(2000).optional();
const shortText = z.string().trim().max(200).optional();
const longText = z.string().trim().max(2000).optional();

const colorsSchema = z.object({
  primary: shortText,
  secondary: shortText,
  accent: shortText,
  background: shortText,
  text: shortText,
}).partial();

const appearanceSchema = z.object({
  colors: colorsSchema.optional(),
  typography: z.object({
    headingFont: shortText,
    bodyFont: shortText,
  }).partial().optional(),
  buttonStyle: z.enum(['rounded', 'pill', 'square']).optional(),
  cardStyle: z.enum(['shadow', 'outline', 'minimal']).optional(),
}).partial();

const seoSchema = z.object({
  metaTitle: shortText,
  metaDescription: z.string().trim().max(500).optional(),
  ogImageUrl: url,
  keywords: z.string().trim().max(500).optional(),
  canonicalUrl: url,
}).partial();

const businessInfoSchema = z.object({
  address: longText,
  phone: shortText,
  email: shortText,
  whatsapp: shortText,
  mapsLink: url,
  socialLinks: z.object({
    facebook: url,
    instagram: url,
    twitter: url,
    youtube: url,
    linkedin: url,
  }).partial().optional(),
}).partial();

// Section content shapes vary per section type (hero, features, gallery, ...) and are re-checked
// client-side by the builder's own per-type editors — validated loosely here (bounded size, not
// per-field) so the API still rejects oversized/malformed payloads without duplicating all 14
// section-type schemas from lib/website/types.ts.
const sectionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  type: z.string().trim().min(1).max(50),
  isVisible: z.boolean(),
  order: z.number().finite(),
  data: z.record(z.string(), z.any()),
});

const pagesSchema = z.object({
  about: z.boolean().optional(),
  shop: z.boolean().optional(),
  contact: z.boolean().optional(),
}).partial();

export const websiteConfigSchema = z.object({
  theme: z.enum(THEME_IDS),
  appearance: appearanceSchema.optional(),
  seo: seoSchema.optional(),
  businessInfo: businessInfoSchema.optional(),
  sections: z.array(sectionSchema).max(50).optional(),
  pages: pagesSchema.optional(),
});

// Public, unauthenticated endpoints (contact form + visit beacon) — anyone can POST these, so
// validation here is the only thing standing between the DB and arbitrary input.
export const contactLeadSchema = z.object({
  tenantId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  source: z.enum(['website', 'menu', 'qr']).optional(),
});

export const websiteVisitSchema = z.object({
  tenantId: z.string().trim().min(1).max(100),
  path: z.string().trim().min(1).max(500),
  referrer: z.string().trim().max(2000).optional(),
  pageTitle: z.string().trim().max(300).optional(),
});
