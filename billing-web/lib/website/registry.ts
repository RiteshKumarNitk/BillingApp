import { WebsiteConfig, WebsiteSection } from './types';
import dynamic from 'next/dynamic';

export type SectionComponentProps = {
  section: WebsiteSection;
  tenantInfo?: any;
};

export const themes = [
  {
    id: 'modern-restaurant',
    name: 'Modern Restaurant',
    description: 'A beautiful theme for restaurants and cafes.',
    defaultColors: { primary: '#ef4444', secondary: '#f59e0b' },
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    description: 'Elegant and clean design for apparel and boutiques.',
    defaultColors: { primary: '#111827', secondary: '#6b7280' },
  },
  {
    id: 'premium-food',
    name: 'Premium Food',
    description: 'A luxurious and modern template for high-end restaurants.',
    defaultColors: { primary: '#EAB308', secondary: '#1F2937', background: '#FAF9F5' },
  },
  {
    id: 'fresh-harvest',
    name: 'Fresh Harvest',
    description: 'Farm-fresh theme for vegetable, fruit and grocery stores.',
    defaultColors: { primary: '#22c55e', secondary: '#16a34a', background: '#f0fdf4' },
  },
  {
    id: 'organic-grove',
    name: 'Organic Grove',
    description: 'Earthy organic theme for natural food and wellness stores.',
    defaultColors: { primary: '#8B5CF6', secondary: '#166534', background: '#faf5eb' },
  },
  {
    id: 'fruit-fresh',
    name: 'Fruit Fresh',
    description: 'Vibrant and colorful theme for fruit shops and juice bars.',
    defaultColors: { primary: '#f97316', secondary: '#ec4899', background: '#fff7ed' },
  },
  {
    id: 'minimal-cafe',
    name: 'Minimal Cafe',
    description: 'Clean, quiet, menu-first design for coffee shops and cafes.',
    defaultColors: { primary: '#2D2A26', secondary: '#C9A876', background: '#FAFAF8' },
  },
  {
    id: 'modern-coffee',
    name: 'Modern Coffee',
    description: 'Bold, warm coffee-house theme with a card-style menu and gallery.',
    defaultColors: { primary: '#6F4E37', secondary: '#D4A24C', background: '#FFF8F0' },
  },
];

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
