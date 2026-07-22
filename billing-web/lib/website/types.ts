export interface SectionBase {
  id: string;
  type: string;
  isVisible: boolean;
  order: number;
}

export interface HeroSection extends SectionBase {
  type: 'hero';
  data: {
    title: string;
    subtitle?: string;
    ctaPrimary?: { label: string; url: string };
    ctaSecondary?: { label: string; url: string };
    backgroundImageUrl?: string;
  };
}

export interface FeaturesSection extends SectionBase {
  type: 'features';
  data: {
    title: string;
    subtitle?: string;
    features: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
  };
}

export interface GallerySection extends SectionBase {
  type: 'gallery';
  data: {
    title: string;
    subtitle?: string;
    images: Array<{
      url: string;
      caption?: string;
    }>;
  };
}

export interface FooterSection extends SectionBase {
  type: 'footer';
  data: {
    copyrightText: string;
    showSocialLinks: boolean;
  };
}

export interface MenuGridSection extends SectionBase {
  type: 'menu-grid';
  data: {
    title: string;
    subtitle?: string;
    // Curated Featured Menu: when true, shows only products the owner flagged Featured in Menu
    // Management (Product.isFeatured) instead of auto-slicing the full catalog.
    featuredOnly?: boolean;
  };
}

export interface TodaysSpecialSection extends SectionBase {
  type: 'todays-special';
  data: {
    title: string;
    subtitle?: string;
  };
}

export interface GoogleMapSection extends SectionBase {
  type: 'google-map';
  data: {
    title: string;
    subtitle?: string;
  };
}

export interface PopularDishesSection extends SectionBase {
  type: 'popular-dishes';
  data: {
    title: string;
    subtitle?: string;
  };
}

export interface ReservationSection extends SectionBase {
  type: 'reservation';
  data: {
    title: string;
    subtitle?: string;
    buttonText?: string;
  };
}

export interface TestimonialsSection extends SectionBase {
  type: 'testimonials';
  data: {
    title: string;
    subtitle?: string;
    reviews: Array<{
      id: string;
      text: string;
      authorName: string;
      authorRole?: string;
      avatarUrl?: string;
      rating?: number;
    }>;
  };
}

export interface TeamSection extends SectionBase {
  type: 'team';
  data: {
    title: string;
    subtitle?: string;
    members: Array<{
      id: string;
      name: string;
      role: string;
      imageUrl?: string;
    }>;
  };
}

export interface AppDownloadSection extends SectionBase {
  type: 'app-download';
  data: {
    title: string;
    subtitle?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
  };
}

export interface CategoriesSection extends SectionBase {
  type: 'categories';
  data: {
    title: string;
    subtitle?: string;
    categories?: Array<{
      id: string;
      name: string;
      imageUrl: string;
    }>;
  };
}

export interface FeaturedProductsSection extends SectionBase {
  type: 'featured-products';
  data: {
    title: string;
    subtitle?: string;
  };
}

export interface PromoBannerSection extends SectionBase {
  type: 'promo-banner';
  data: {
    title: string;
    subtitle?: string;
    buttonText?: string;
    imageUrl?: string;
  };
}

export interface NewsletterSection extends SectionBase {
  type: 'newsletter';
  data: {
    title: string;
    subtitle?: string;
    placeholderText?: string;
    buttonText?: string;
  };
}

export type WebsiteSection = HeroSection | FeaturesSection | GallerySection | FooterSection | MenuGridSection | PopularDishesSection | ReservationSection | TestimonialsSection | TeamSection | AppDownloadSection | CategoriesSection | FeaturedProductsSection | PromoBannerSection | NewsletterSection | TodaysSpecialSection | GoogleMapSection;

export interface WebsiteConfig {
  theme: string;
  appearance?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
    };
    typography?: {
      headingFont?: string;
      bodyFont?: string;
    };
    buttonStyle?: 'rounded' | 'pill' | 'square';
    cardStyle?: 'shadow' | 'outline' | 'minimal';
    // Navbar isn't a WebsiteSection (it's chrome, not a section in config.sections), so unlike
    // every other section's variant — chosen via ThemeDefinition.sectionVariants, see
    // components/website/engine/ — its variant lives here instead.
    navStyle?: 'minimal' | 'pill' | 'cta';
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    keywords?: string;
    canonicalUrl?: string;
    faviconUrl?: string;
  };
  businessInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    mapsLink?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      linkedin?: string;
    };
    // Structured per-day hours. Optional and additive — Tenant.businessHours (free text) remains
    // the fallback everywhere this is unset, so tenants who never touch this keep working exactly
    // as before.
    hours?: {
      [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: {
        closed?: boolean;
        open?: string;
        close?: string;
      };
    };
  };
  sections?: WebsiteSection[];
  pages?: {
    about?: boolean;
    shop?: boolean;
    contact?: boolean;
  };
}

// A theme is pure configuration for the shared Theme Engine (components/website/engine/) — no
// theme owns its own Layout/Navbar/Footer components anymore. Adding a theme means adding one
// ThemeDefinition and registering it in lib/website/themeDefinitions.ts; nothing else.
export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  // Richer than the old binary CAFE/GENERAL tag — a theme can belong to several browsing
  // categories at once (e.g. ['Modern', 'Coffee']) once the Website Builder picker groups by
  // category. businessTypes below still drives which tenants see the theme at all.
  category: string[];
  businessTypes: string[];
  previewImageUrl?: string;
  thumbnailUrl?: string;
  premium?: boolean;
  featured?: boolean;
  comingSoon?: boolean;
  version: string;
  defaultAppearance: NonNullable<WebsiteConfig['appearance']>;
  defaultSections: WebsiteSection[];
  // Which variant each section type renders in this theme. A section type absent here uses that
  // section component's own default variant.
  sectionVariants: Partial<Record<WebsiteSection['type'], string>>;
  supportedSections: WebsiteSection['type'][];
}
