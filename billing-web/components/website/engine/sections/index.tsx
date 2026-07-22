import Hero from './Hero';
import Features from './Features';
import Gallery from './Gallery';
import MenuGrid from './MenuGrid';
import TodaysSpecial from './TodaysSpecial';
import GoogleMap from './GoogleMap';
import PopularDishes from './PopularDishes';
import Reservation from './Reservation';
import Testimonials from './Testimonials';
import Team from './Team';
import AppDownload from './AppDownload';
import { WebsiteSection } from '@/lib/website/types';

// One shared component per section type actually used by an in-scope ThemeDefinition
// (lib/website/themeDefinitions.ts). A theme never imports these directly — ThemeLayoutShell
// resolves { type -> component } from this map and passes the theme's chosen `variant`
// (sectionVariants) as a prop. Types with no registered component (categories/featured-products/
// promo-banner/newsletter — only ever used by the retired GENERAL themes) simply render nothing;
// register one here the day a theme actually needs it, same pattern as every entry below.
export const SECTION_COMPONENTS: Partial<Record<WebsiteSection['type'], React.ComponentType<any>>> = {
  hero: Hero,
  features: Features,
  gallery: Gallery,
  'menu-grid': MenuGrid,
  'todays-special': TodaysSpecial,
  'google-map': GoogleMap,
  'popular-dishes': PopularDishes,
  reservation: Reservation,
  testimonials: Testimonials,
  team: Team,
  'app-download': AppDownload,
};
