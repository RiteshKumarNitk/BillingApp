import { ThemeDefinition } from './types';

// Single source of truth for every theme — pure data, zero `dynamic()`/client-only imports, so it's
// safe to import from server-only code (lib/website/schema.ts, API routes) as well as client code.
// Adding a theme means adding one entry here and registering its section-component variants in
// components/website/engine/sections/*.tsx — no new Layout.tsx/Navbar.tsx/Footer.tsx, no touching
// any other file's hardcoded id list (see lib/website/registry.ts, which now just looks up here).
export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'modern-restaurant',
    name: 'Modern Restaurant',
    description: 'A beautiful theme for restaurants and cafes.',
    category: ['Modern', 'Restaurant'],
    businessTypes: ['CAFE'],
    version: '1.0.0',
    defaultAppearance: {
      colors: { primary: '#ef4444', secondary: '#f59e0b', background: '#ffffff', text: '#1f2937' },
      buttonStyle: 'pill',
      cardStyle: 'shadow',
      navStyle: 'cta',
    },
    defaultSections: [
      { id: 'm1', type: 'hero', isVisible: true, order: 1, data: { title: 'Welcome', subtitle: 'Experience the best dining in town.' } },
      { id: 'm2', type: 'features', isVisible: true, order: 2, data: { title: 'Why Choose Us', subtitle: '', features: [] } },
      { id: 'm3', type: 'gallery', isVisible: true, order: 3, data: { title: 'Our Gallery', images: [] } },
      { id: 'm4', type: 'footer', isVisible: true, order: 4, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } },
    ],
    sectionVariants: { hero: 'overlay', features: 'cards', gallery: 'caption', footer: 'dark' },
    supportedSections: ['hero', 'features', 'gallery', 'footer'],
  },
  {
    id: 'premium-food',
    name: 'Premium Food',
    description: 'A luxurious and modern template for high-end restaurants.',
    category: ['Luxury', 'Restaurant'],
    businessTypes: ['CAFE'],
    version: '1.0.0',
    defaultAppearance: {
      colors: { primary: '#EAB308', secondary: '#1F2937', background: '#FAF9F5', text: '#1F2937' },
      buttonStyle: 'pill',
      cardStyle: 'shadow',
      navStyle: 'cta',
    },
    defaultSections: [
      { id: 's1', type: 'hero', isVisible: true, order: 1, data: { title: 'We Serve The Taste You Love', subtitle: 'This is a type of restaurant which typically serves food and drinks.' } },
      { id: 's2', type: 'popular-dishes', isVisible: true, order: 2, data: { title: 'Popular Dishes' } },
      { id: 's3', type: 'features', isVisible: true, order: 3, data: { title: 'We Are More Than Multiple Service', subtitle: '', features: [] } },
      { id: 's4', type: 'menu-grid', isVisible: true, order: 4, data: { title: 'Our Regular Menu Pack' } },
      { id: 's5', type: 'reservation', isVisible: true, order: 5, data: { title: 'Do You Have Any Dinner Plan Today? Reserve Your Table' } },
      { id: 's6', type: 'testimonials', isVisible: true, order: 6, data: { title: 'What Our Customer Says?', reviews: [] } },
      { id: 's7', type: 'team', isVisible: true, order: 7, data: { title: 'Meet Our Chefs', members: [] } },
      { id: 's8', type: 'app-download', isVisible: true, order: 8, data: { title: 'Never Feel Hungry! Download Our Mobile App' } },
      { id: 's9', type: 'footer', isVisible: true, order: 9, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } },
    ],
    sectionVariants: { hero: 'luxury', features: 'luxury', 'menu-grid': 'luxury', testimonials: 'carousel', footer: 'dark' },
    supportedSections: ['hero', 'popular-dishes', 'features', 'menu-grid', 'reservation', 'testimonials', 'team', 'app-download', 'footer'],
  },
  {
    id: 'minimal-cafe',
    name: 'Minimal Cafe',
    description: 'Clean, quiet, menu-first design for coffee shops and cafes.',
    category: ['Minimal', 'Coffee'],
    businessTypes: ['CAFE'],
    version: '1.0.0',
    defaultAppearance: {
      colors: { primary: '#2D2A26', secondary: '#C9A876', background: '#FAFAF8', text: '#2D2A26' },
      buttonStyle: 'square',
      cardStyle: 'minimal',
      navStyle: 'minimal',
    },
    defaultSections: [
      { id: 'mc1', type: 'hero', isVisible: true, order: 1, data: { title: 'A Quiet Place For Good Coffee', subtitle: 'Small batch coffee, simple food, made with care.' } },
      { id: 'mc2', type: 'menu-grid', isVisible: true, order: 2, data: { title: 'The Menu' } },
      { id: 'mc3', type: 'gallery', isVisible: true, order: 3, data: { title: 'The Space', images: [] } },
      { id: 'mc4', type: 'footer', isVisible: true, order: 4, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } },
    ],
    sectionVariants: { hero: 'minimal', 'menu-grid': 'list', 'todays-special': 'minimal', 'google-map': 'square', gallery: 'simple', footer: 'minimal' },
    supportedSections: ['hero', 'menu-grid', 'todays-special', 'google-map', 'gallery', 'footer'],
  },
  {
    id: 'modern-coffee',
    name: 'Modern Coffee',
    description: 'Bold, warm coffee-house theme with a card-style menu and gallery.',
    category: ['Modern', 'Coffee'],
    businessTypes: ['CAFE'],
    version: '1.0.0',
    defaultAppearance: {
      colors: { primary: '#6F4E37', secondary: '#D4A24C', accent: '#D4A24C', background: '#FFF8F0', text: '#3B2A20' },
      buttonStyle: 'pill',
      cardStyle: 'shadow',
      navStyle: 'pill',
    },
    defaultSections: [
      { id: 'mdc1', type: 'hero', isVisible: true, order: 1, data: { title: 'Great Coffee, Every Time', subtitle: 'Handcrafted coffee and fresh bakes, made for your day.' } },
      { id: 'mdc2', type: 'menu-grid', isVisible: true, order: 2, data: { title: 'Our Menu', subtitle: 'Brewed fresh, every single cup' } },
      { id: 'mdc3', type: 'testimonials', isVisible: true, order: 3, data: { title: 'What People Say', reviews: [] } },
      { id: 'mdc4', type: 'gallery', isVisible: true, order: 4, data: { title: 'Inside The Cafe', images: [] } },
      { id: 'mdc5', type: 'footer', isVisible: true, order: 5, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } },
    ],
    sectionVariants: { hero: 'pill', 'menu-grid': 'cards', 'todays-special': 'pill', 'google-map': 'rounded', testimonials: 'grid', gallery: 'featured', footer: 'primary' },
    supportedSections: ['hero', 'menu-grid', 'todays-special', 'google-map', 'testimonials', 'gallery', 'footer'],
  },
];

export const DEFAULT_THEME_ID = 'premium-food';

export function getThemeDefinition(themeId: string | null | undefined): ThemeDefinition {
  return THEME_DEFINITIONS.find((t) => t.id === themeId) || THEME_DEFINITIONS.find((t) => t.id === DEFAULT_THEME_ID)!;
}

export function getThemesForBusinessType(businessType: string | null | undefined): ThemeDefinition[] {
  const tag = businessType === 'CAFE' ? 'CAFE' : 'GENERAL';
  return THEME_DEFINITIONS.filter((t) => t.businessTypes.includes(tag));
}

export interface DefaultConfigTenant {
  name?: string | null;
  aboutText?: string | null;
}

// Replaces the old lib/website/themeDefaults.ts factory map — each theme's starter sections are
// now just a field on its ThemeDefinition. tenant.name/aboutText still get interpolated into the
// hero copy the same way the old factories did.
export function getThemeDefaultConfig(themeId: string, tenant: DefaultConfigTenant = {}) {
  const def = getThemeDefinition(themeId);
  const sections = def.defaultSections.map((s) => {
    if (s.type !== 'hero') return s;
    return {
      ...s,
      data: {
        ...s.data,
        title: tenant.name && def.id !== 'premium-food' ? interpolateTitle(def.id, tenant.name) : s.data.title,
        subtitle: tenant.aboutText || s.data.subtitle,
      },
    };
  });
  return { theme: def.id, appearance: def.defaultAppearance, sections };
}

function interpolateTitle(themeId: string, tenantName: string): string {
  if (themeId === 'modern-restaurant' || themeId === 'modern-coffee') return `Welcome to ${tenantName}`;
  if (themeId === 'minimal-cafe') return tenantName;
  return tenantName;
}
