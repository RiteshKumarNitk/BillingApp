import type { CSSProperties } from 'react';

// Design tokens for the public tenant site (app/menu/[tenantId]/*). Two committed identities —
// MARKET (general retail/grocery) and RESTAURANT (food service) — driven by CSS custom properties
// applied once in MenuShell.tsx and consumed by every page (Home/Shop/About/Contact). Legacy
// `menuTheme` values saved before this system existed (DEFAULT, DARK, ELEGANT, PLAYFUL) all fall
// back to MARKET; see getMenuTheme below.

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

export const MENU_THEMES: Record<MenuTheme['id'], MenuTheme> = {
  MARKET: {
    id: 'MARKET',
    label: 'Market',
    bg: '#F6F7F2',
    surface: '#FFFFFF',
    ink: '#16241D',
    muted: '#66756C',
    line: '#E7E9E0',
    primary: '#1F5E4C',
    primaryInk: '#F2F7F1',
    accent: '#E3A335',
    accentInk: '#241B06',
    displayFont: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    radius: 'rounded',
  },
  RESTAURANT: {
    id: 'RESTAURANT',
    label: 'Restaurant',
    bg: '#1B1512',
    surface: '#241C17',
    ink: '#F4EBDF',
    muted: '#B7A594',
    line: '#3A2E26',
    primary: '#C97B3D',
    primaryInk: '#201209',
    accent: '#7FA37A',
    accentInk: '#12180F',
    displayFont: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
    radius: 'soft',
  },
};

export function getMenuTheme(themeValue: string | null | undefined): MenuTheme {
  return themeValue === 'RESTAURANT' ? MENU_THEMES.RESTAURANT : MENU_THEMES.MARKET;
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
