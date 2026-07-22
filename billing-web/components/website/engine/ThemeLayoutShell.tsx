import React from 'react';
import { WebsiteConfig, WebsiteSection } from '@/lib/website/types';
import { getThemeDefinition } from '@/lib/website/themeDefinitions';
import { SECTION_COMPONENTS } from './sections';
import NavbarShell from './NavbarShell';
import FooterShell from './FooterShell';

interface ThemeLayoutShellProps {
  config: WebsiteConfig;
  tenant: any;
  children?: React.ReactNode;
}

// The single rendering path every theme shares — generalized from what was previously eight
// near-identical Layout.tsx files (sort/filter sections, set --theme-* CSS vars, dispatch each
// section type to a component, wrap in Navbar/Footer). A theme no longer owns any of this; it
// only supplies a ThemeDefinition (colors/fonts/variant choices) in lib/website/themeDefinitions.ts.
export default function ThemeLayoutShell({ config, tenant, children }: ThemeLayoutShellProps) {
  const def = getThemeDefinition(config.theme);
  const defaults = def.defaultAppearance;

  const sections = [...(config.sections || [])]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const footerSection = sections.find((s) => s.type === 'footer');
  const bodySections = sections.filter((s) => s.type !== 'footer');

  const renderSection = (section: WebsiteSection) => {
    const Component = SECTION_COMPONENTS[section.type];
    if (!Component) return null;
    const variant = def.sectionVariants[section.type];
    return <Component key={section.id} data={section.data} config={config} tenant={tenant} variant={variant} />;
  };

  const primaryColor = config.appearance?.colors?.primary || defaults.colors?.primary;
  const backgroundColor = config.appearance?.colors?.background || defaults.colors?.background;
  const textColor = config.appearance?.colors?.text || defaults.colors?.text;
  const accentColor = config.appearance?.colors?.accent || defaults.colors?.accent || primaryColor;

  return (
    <div
      className="site-shell min-h-screen flex flex-col"
      style={{
        backgroundColor,
        color: textColor,
        '--theme-primary': primaryColor,
        '--theme-secondary': config.appearance?.colors?.secondary || defaults.colors?.secondary,
        '--theme-accent': accentColor,
        '--theme-background': backgroundColor,
        '--theme-font-heading': config.appearance?.typography?.headingFont || defaults.typography?.headingFont || undefined,
        '--theme-font-body': config.appearance?.typography?.bodyFont || defaults.typography?.bodyFont || undefined,
      } as React.CSSProperties}
    >
      <NavbarShell tenant={tenant} config={config} variant={config.appearance?.navStyle || defaults.navStyle} />
      <main className="flex-grow">
        {children ? children : bodySections.map(renderSection)}
      </main>
      {footerSection && (
        <FooterShell data={footerSection.data as any} config={config} tenant={tenant} variant={def.sectionVariants.footer as any} />
      )}
    </div>
  );
}
