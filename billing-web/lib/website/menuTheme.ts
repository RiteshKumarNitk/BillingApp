import type { CSSProperties } from 'react';
import type { WebsiteConfig } from './types';
import { getThemeDefinition } from './themeDefinitions';

// The /site/[tenantId]/shop page uses this MenuTheme shape for its CSS custom properties
// (--bg, --surface, --ink, --primary, ...). The layout id is now derived from the tenant's actual
// website theme (its Home page's menu-grid section variant — lib/website/themeDefinitions.ts),
// not a separate Tenant.menuTheme toggle (that field has no UI to set it and is effectively
// unused — kept here only as a future manual-override hook, honored only if already one of the
// new valid ids). This is what keeps the real ordering page visually consistent with the rest of
// the tenant's site instead of being a generic layout bolted on top.

export interface MenuTheme {
  id: 'GRID' | 'LIST';
  label: string;
  bg: string;
  surface: string;
  ink: string;
  // Text color for content sitting directly on `bg` (category headers, sidebar) — distinct from
  // `ink`, which for GRID is calibrated for the fixed white card `surface`, not the page itself.
  // For LIST there's no separate surface, so this equals `ink`.
  pageInk: string;
  muted: string;
  line: string;
  primary: string;
  primaryInk: string;
  accent: string;
  accentInk: string;
  displayFont: string;
  radius: 'rounded' | 'soft';
}

function isDarkColor(hex?: string): boolean {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function resolveLayoutId(layoutStyleValue: string | null | undefined, config?: WebsiteConfig): 'GRID' | 'LIST' {
  if (layoutStyleValue === 'GRID' || layoutStyleValue === 'LIST') return layoutStyleValue;
  const def = getThemeDefinition(config?.theme);
  return def.sectionVariants['menu-grid'] === 'list' ? 'LIST' : 'GRID';
}

export function getMenuTheme(layoutStyleValue: string | null | undefined, config?: WebsiteConfig): MenuTheme {
  const id = resolveLayoutId(layoutStyleValue, config);
  const colors = config?.appearance?.colors;
  const fallbackFont = config?.appearance?.typography?.headingFont
    || (id === 'LIST' ? 'Georgia, "Times New Roman", serif' : '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif');

  if (id === 'LIST') {
    // No separate "card" surface — text sits directly on the theme's own page background,
    // matching Home's MenuGrid 'list' variant. Ink/muted/line must be readable against whatever
    // that background actually is (light or dark theme), unlike GRID's fixed white surface below.
    const bg = colors?.background || '#F7F5EF';
    const dark = isDarkColor(bg);
    return {
      id,
      label: 'List',
      bg,
      surface: bg,
      ink: colors?.text || (dark ? '#F4EBDF' : '#16241D'),
      pageInk: colors?.text || (dark ? '#F4EBDF' : '#16241D'),
      muted: dark ? '#B7A594' : '#66756C',
      line: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
      primary: colors?.primary || (dark ? '#C97B3D' : '#1F5E4C'),
      primaryInk: '#FFFFFF',
      accent: colors?.accent || colors?.secondary || colors?.primary || (dark ? '#7FA37A' : '#E3A335'),
      accentInk: '#FFFFFF',
      displayFont: fallbackFont,
      radius: 'soft',
    };
  }

  // GRID — elevated white product cards, kept white even on a dark theme (matches the deliberate
  // "cards pop off the page" choice already made for Home's MenuGrid 'cards'/'luxury' variants).
  const gridBg = colors?.background || '#F6F7F2';
  const gridBgDark = isDarkColor(gridBg);
  return {
    id,
    label: 'Grid',
    bg: gridBg,
    surface: '#FFFFFF',
    // Always the safe default for a white surface — never the theme's own page text color, which
    // may be a light color calibrated for a dark page and would go near-invisible here.
    ink: '#16241D',
    // Unlike `ink` above, this sits on `bg` itself (category headers, sidebar) — must match the
    // page's actual darkness, not assume the fixed white card surface.
    pageInk: colors?.text || (gridBgDark ? '#F4EBDF' : '#16241D'),
    muted: gridBgDark ? '#B7A594' : '#66756C',
    line: gridBgDark ? 'rgba(255,255,255,0.12)' : '#E7E9E0',
    primary: colors?.primary || '#1F5E4C',
    primaryInk: '#FFFFFF',
    accent: colors?.accent || colors?.secondary || colors?.primary || '#E3A335',
    accentInk: '#FFFFFF',
    displayFont: fallbackFont,
    radius: 'rounded',
  };
}

export function menuThemeCssVars(theme: MenuTheme): CSSProperties {
  return {
    '--bg': theme.bg,
    '--surface': theme.surface,
    '--ink': theme.ink,
    '--page-ink': theme.pageInk,
    '--muted': theme.muted,
    '--line': theme.line,
    '--primary': theme.primary,
    '--primary-ink': theme.primaryInk,
    '--accent': theme.accent,
    '--accent-ink': theme.accentInk,
    '--font-display': theme.displayFont,
  } as CSSProperties;
}
