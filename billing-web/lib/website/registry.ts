// Thin re-export kept so existing import paths (`@/lib/website/registry`) keep working. The real
// data now lives in lib/website/themeDefinitions.ts — a theme is a ThemeDefinition, not a
// dynamic()-imported component tree, so there's no more themeLayouts/themeNavbars/themeFooters
// lookup here; every theme renders through the shared components/website/engine/* shells.
export { THEME_DEFINITIONS as themes, getThemesForBusinessType, getThemeDefinition } from './themeDefinitions';
