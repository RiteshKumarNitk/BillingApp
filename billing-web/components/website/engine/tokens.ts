import { WebsiteConfig } from '@/lib/website/types';

// Design-token → Tailwind-class helpers shared by every section component in the engine, so a
// theme's buttonStyle/cardStyle tokens (lib/website/types.ts) actually do something instead of
// sitting unused (as they did before this engine existed).

export function buttonRadiusClass(config: WebsiteConfig): string {
  switch (config.appearance?.buttonStyle) {
    case 'square': return 'rounded-none';
    case 'pill': return 'rounded-full';
    case 'rounded':
    default: return 'rounded-full';
  }
}

export function cardRadiusClass(config: WebsiteConfig): string {
  switch (config.appearance?.cardStyle) {
    case 'minimal': return 'rounded-none';
    case 'outline': return 'rounded-xl border border-black/10';
    case 'shadow':
    default: return 'rounded-2xl shadow-sm';
  }
}

export function sectionBg(varName: '--theme-background' | '--theme-primary' = '--theme-background') {
  return { backgroundColor: `var(${varName})` } as React.CSSProperties;
}
