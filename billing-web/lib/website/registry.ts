import { WebsiteConfig, WebsiteSection } from './types';
import dynamic from 'next/dynamic';

export type SectionComponentProps = {
  section: WebsiteSection;
  tenantInfo?: any;
};

// businessTypes tags which Tenant.businessType this theme is meant for — see
// getThemesForBusinessType below. CAFE-tagged themes are food/beverage-menu-first designs;
// GENERAL covers everything else (retail/grocery) and is also the fallback for LAUNDRY/SALON,
// which don't have dedicated themes of their own yet (both remain dormant scaffolding — see
// AGENTS.md / the CafeOS plan notes).
export const themes = [
  {
    id: 'modern-restaurant',
    name: 'Modern Restaurant',
    description: 'A beautiful theme for restaurants and cafes.',
    defaultColors: { primary: '#ef4444', secondary: '#f59e0b' },
    businessTypes: ['CAFE'],
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    description: 'Elegant and clean design for apparel and boutiques.',
    defaultColors: { primary: '#111827', secondary: '#6b7280' },
    businessTypes: ['GENERAL'],
  },
  {
    id: 'premium-food',
    name: 'Premium Food',
    description: 'A luxurious and modern template for high-end restaurants.',
    defaultColors: { primary: '#EAB308', secondary: '#1F2937', background: '#FAF9F5' },
    businessTypes: ['CAFE'],
  },
  {
    id: 'fresh-harvest',
    name: 'Fresh Harvest',
    description: 'Farm-fresh theme for vegetable, fruit and grocery stores.',
    defaultColors: { primary: '#22c55e', secondary: '#16a34a', background: '#f0fdf4' },
    businessTypes: ['GENERAL'],
  },
  {
    id: 'organic-grove',
    name: 'Organic Grove',
    description: 'Earthy organic theme for natural food and wellness stores.',
    defaultColors: { primary: '#8B5CF6', secondary: '#166534', background: '#faf5eb' },
    businessTypes: ['GENERAL'],
  },
  {
    id: 'fruit-fresh',
    name: 'Fruit Fresh',
    description: 'Vibrant and colorful theme for fruit shops and juice bars.',
    defaultColors: { primary: '#f97316', secondary: '#ec4899', background: '#fff7ed' },
    businessTypes: ['GENERAL'],
  },
  {
    id: 'minimal-cafe',
    name: 'Minimal Cafe',
    description: 'Clean, quiet, menu-first design for coffee shops and cafes.',
    defaultColors: { primary: '#2D2A26', secondary: '#C9A876', background: '#FAFAF8' },
    businessTypes: ['CAFE'],
  },
  {
    id: 'modern-coffee',
    name: 'Modern Coffee',
    description: 'Bold, warm coffee-house theme with a card-style menu and gallery.',
    defaultColors: { primary: '#6F4E37', secondary: '#D4A24C', background: '#FFF8F0' },
    businessTypes: ['CAFE'],
  },
];

// A tenant only ever sees themes built for their own business — a laundromat has no use for a
// "Fruit Fresh" juice-bar theme, and a cafe shouldn't have to wade through fashion-store designs.
// LAUNDRY/SALON have no dedicated themes yet, so they fall back to the GENERAL set rather than
// showing nothing.
export function getThemesForBusinessType(businessType: string | null | undefined) {
  const tag = businessType === 'CAFE' ? 'CAFE' : 'GENERAL';
  return themes.filter((t) => t.businessTypes.includes(tag));
}

export const themeLayouts: Record<string, any> = {
  'modern-restaurant': dynamic(() => import('@/components/website/themes/modern-restaurant/Layout')),
  'fashion-store': dynamic(() => import('@/components/website/themes/fashion-store/Layout')),
  'premium-food': dynamic(() => import('@/components/website/themes/premium-food/Layout')),
  'fresh-harvest': dynamic(() => import('@/components/website/themes/fresh-harvest/Layout')),
  'organic-grove': dynamic(() => import('@/components/website/themes/organic-grove/Layout')),
  'fruit-fresh': dynamic(() => import('@/components/website/themes/fruit-fresh/Layout')),
  'minimal-cafe': dynamic(() => import('@/components/website/themes/minimal-cafe/Layout')),
  'modern-coffee': dynamic(() => import('@/components/website/themes/modern-coffee/Layout')),
};

export const themeNavbars: Record<string, any> = {
  'modern-restaurant': dynamic(() => import('@/components/website/themes/modern-restaurant/sections/Navbar')),
  'fashion-store': dynamic(() => import('@/components/website/themes/fashion-store/sections/Navbar')),
  'premium-food': dynamic(() => import('@/components/website/themes/premium-food/sections/Navbar')),
  'fresh-harvest': dynamic(() => import('@/components/website/themes/fresh-harvest/sections/Navbar')),
  'organic-grove': dynamic(() => import('@/components/website/themes/organic-grove/sections/Navbar')),
  'fruit-fresh': dynamic(() => import('@/components/website/themes/fruit-fresh/sections/Navbar')),
  'minimal-cafe': dynamic(() => import('@/components/website/themes/minimal-cafe/sections/Navbar')),
  'modern-coffee': dynamic(() => import('@/components/website/themes/modern-coffee/sections/Navbar')),
};

export const themeFooters: Record<string, any> = {
  'modern-restaurant': dynamic(() => import('@/components/website/themes/modern-restaurant/sections/Footer')),
  'fashion-store': dynamic(() => import('@/components/website/themes/fashion-store/sections/Footer')),
  'premium-food': dynamic(() => import('@/components/website/themes/premium-food/sections/Footer')),
  'fresh-harvest': dynamic(() => import('@/components/website/themes/fresh-harvest/sections/Footer')),
  'organic-grove': dynamic(() => import('@/components/website/themes/organic-grove/sections/Footer')),
  'fruit-fresh': dynamic(() => import('@/components/website/themes/fruit-fresh/sections/Footer')),
  'minimal-cafe': dynamic(() => import('@/components/website/themes/minimal-cafe/sections/Footer')),
  'modern-coffee': dynamic(() => import('@/components/website/themes/modern-coffee/sections/Footer')),
};

export const getThemeLayout = (themeId: string) => {
  return themeLayouts[themeId] || themeLayouts['modern-restaurant'];
};
