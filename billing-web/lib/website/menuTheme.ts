import type { CSSProperties } from 'react';
import type { WebsiteConfig } from './types';

// The /site/[tenantId]/shop page and shared cart UI (components/website/CartComponents.tsx) use
// this MenuTheme shape for their CSS custom properties (--bg, --surface, --ink, --primary, ...).
// It used to come from a hardcoded MARKET/RESTAURANT color palette that predated the 6-theme
// Website Builder system and was never actually applied anywhere (menuThemeCssVars had no
// caller), so the tenant's real site colors never reached the ordering UI. `layoutStyle` (from
// Tenant.menuTheme) now only controls layout density — compact list rows vs. spacious dish
// cards — while every color comes from the tenant's actual selected WebsiteConfig theme.

export interface MenuTheme {
  id: 'MARKET' | 'RESTAURANT';
  label: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  primary: string;
  primaryInk: string;
  accent: string;
  accentInk: string;
  displayFont: string;
  radius: 'rounded' | 'soft';
}

const LAYOUT_STYLE: Record<'MARKET' | 'RESTAURANT', { label: string; radius: 'rounded' | 'soft'; fallbackFont: string }> = {
  MARKET: {
    label: 'Market',
    radius: 'rounded',
    fallbackFont: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  RESTAURANT: {
    label: 'Restaurant',
    radius: 'soft',
    fallbackFont: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
  },
};

export function getMenuTheme(layoutStyleValue: string | null | undefined, config?: WebsiteConfig): MenuTheme {
  const id: 'MARKET' | 'RESTAURANT' = layoutStyleValue === 'RESTAURANT' ? 'RESTAURANT' : 'MARKET';
  const style = LAYOUT_STYLE[id];
  const colors = config?.appearance?.colors;
  const isDark = id === 'RESTAURANT';

  return {
    id,
    label: style.label,
    bg: colors?.background || (isDark ? '#1B1512' : '#F6F7F2'),
    surface: isDark ? '#241C17' : '#FFFFFF',
    ink: colors?.text || (isDark ? '#F4EBDF' : '#16241D'),
    muted: isDark ? '#B7A594' : '#66756C',
    line: isDark ? '#3A2E26' : '#E7E9E0',
    primary: colors?.primary || (isDark ? '#C97B3D' : '#1F5E4C'),
    primaryInk: '#FFFFFF',
    accent: colors?.accent || colors?.secondary || colors?.primary || (isDark ? '#7FA37A' : '#E3A335'),
    accentInk: '#FFFFFF',
    displayFont: config?.appearance?.typography?.headingFont || style.fallbackFont,
    radius: style.radius,
  };
}

export function menuThemeCssVars(theme: MenuTheme): CSSProperties {
  return {
    '--bg': theme.bg,
    '--surface': theme.surface,
    '--ink': theme.ink,
    '--muted': theme.muted,
    '--line': theme.line,
    '--primary': theme.primary,
    '--primary-ink': theme.primaryInk,
    '--accent': theme.accent,
    '--accent-ink': theme.accentInk,
    '--font-display': theme.displayFont,
  } as CSSProperties;
}
