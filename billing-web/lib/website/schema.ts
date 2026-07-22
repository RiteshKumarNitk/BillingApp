import { z } from 'zod';
import { THEME_DEFINITIONS } from './themeDefinitions';

// lib/website/themeDefinitions.ts is pure data (no next/dynamic component imports), so it's safe
// to import here even though this schema also runs in server-only contexts — unlike the old
// registry.ts, which mixed theme metadata with client-only dynamic() lookups.
const THEME_IDS = THEME_DEFINITIONS.map((t) => t.id) as [string, ...string[]];

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
  navStyle: z.enum(['minimal', 'pill', 'cta']).optional(),
}).partial();

const seoSchema = z.object({
  metaTitle: shortText,
  metaDescription: z.string().trim().max(500).optional(),
  ogImageUrl: url,
  keywords: z.string().trim().max(500).optional(),
  canonicalUrl: url,
  faviconUrl: url,
}).partial();

const dayHoursSchema = z.object({
  closed: z.boolean().optional(),
  open: shortText,
  close: shortText,
}).partial();

const hoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
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
  hours: hoursSchema.optional(),
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
