import { NextResponse } from 'next/server';
import { WebsiteConfig } from '@/lib/website/types';

const defaults: Record<string, WebsiteConfig> = {
  'premium-food': {
    theme: 'premium-food',
    appearance: { colors: { primary: '#EAB308', background: '#FAF9F5', text: '#1F2937' } },
    sections: [
      { id: 's1', type: 'hero', isVisible: true, order: 1, data: { title: 'We Serve The Taste You Love', subtitle: '' } },
      { id: 's2', type: 'popular-dishes', isVisible: true, order: 2, data: { title: 'Popular Dishes' } },
      { id: 's3', type: 'features', isVisible: true, order: 3, data: { title: 'We Are More Than Multiple Service', subtitle: '', features: [] } },
      { id: 's4', type: 'menu-grid', isVisible: true, order: 4, data: { title: 'Our Regular Menu Pack' } },
      { id: 's5', type: 'reservation', isVisible: true, order: 5, data: { title: 'Do You Have Any Dinner Plan Today? Reserve Your Table' } },
      { id: 's6', type: 'testimonials', isVisible: true, order: 6, data: { title: 'What Our Customer Says?', reviews: [] } },
      { id: 's7', type: 'team', isVisible: true, order: 7, data: { title: 'Meet Our Chefs', members: [] } },
      { id: 's8', type: 'app-download', isVisible: true, order: 8, data: { title: 'Never Feel Hungry! Download Our Mobile App' } },
      { id: 's9', type: 'footer', isVisible: true, order: 9, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  },
  'modern-restaurant': {
    theme: 'modern-restaurant',
    appearance: { colors: { primary: '#ef4444', background: '#ffffff', text: '#1f2937' } },
    sections: [
      { id: 'm1', type: 'hero', isVisible: true, order: 1, data: { title: 'Welcome', subtitle: 'Experience the best dining in town.' } },
      { id: 'm2', type: 'features', isVisible: true, order: 2, data: { title: 'Why Choose Us', subtitle: '', features: [] } },
      { id: 'm3', type: 'gallery', isVisible: true, order: 3, data: { title: 'Our Gallery', images: [] } },
      { id: 'm4', type: 'footer', isVisible: true, order: 4, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  },
  'fashion-store': {
    theme: 'fashion-store',
    appearance: { colors: { primary: '#111827', secondary: '#6b7280', background: '#ffffff', text: '#111827' } },
    sections: [
      { id: 'f1', type: 'hero', isVisible: true, order: 1, data: { title: 'New Collection', subtitle: 'Discover Your Style' } },
      { id: 'f2', type: 'categories', isVisible: true, order: 2, data: { title: 'Shop by Category' } },
      { id: 'f3', type: 'featured-products', isVisible: true, order: 3, data: { title: 'Featured Products' } },
      { id: 'f4', type: 'promo-banner', isVisible: true, order: 4, data: { title: 'Get 20% Off Your First Order' } },
      { id: 'f5', type: 'newsletter', isVisible: true, order: 5, data: { title: 'Join Our Newsletter' } },
      { id: 'f6', type: 'footer', isVisible: true, order: 6, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  },
  'fresh-harvest': {
    theme: 'fresh-harvest',
    appearance: { colors: { primary: '#22c55e', secondary: '#16a34a', background: '#f0fdf4', text: '#166534' } },
    sections: [
      { id: 'fh1', type: 'hero', isVisible: true, order: 1, data: { title: 'Fresh From Farm To Your Table', subtitle: '' } },
      { id: 'fh2', type: 'categories', isVisible: true, order: 2, data: { title: 'Shop by Category' } },
      { id: 'fh3', type: 'featured-products', isVisible: true, order: 3, data: { title: 'Featured Fresh Produce' } },
      { id: 'fh4', type: 'features', isVisible: true, order: 4, data: { title: "Nature's Best, Delivered", subtitle: '', features: [] } },
      { id: 'fh5', type: 'gallery', isVisible: true, order: 5, data: { title: 'Our Fresh Collection', images: [] } },
      { id: 'fh6', type: 'testimonials', isVisible: true, order: 6, data: { title: 'What Our Customers Say', reviews: [] } },
      { id: 'fh7', type: 'newsletter', isVisible: true, order: 7, data: { title: 'Get Fresh Updates' } },
      { id: 'fh8', type: 'footer', isVisible: true, order: 8, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  },
  'organic-grove': {
    theme: 'organic-grove',
    appearance: { colors: { primary: '#8B5CF6', secondary: '#166534', background: '#faf5eb', text: '#1c1917' } },
    sections: [
      { id: 'og1', type: 'hero', isVisible: true, order: 1, data: { title: 'Naturally Good For You', subtitle: '' } },
      { id: 'og2', type: 'features', isVisible: true, order: 2, data: { title: "Nature's Finest, Delivered With Care", subtitle: '', features: [] } },
      { id: 'og3', type: 'featured-products', isVisible: true, order: 3, data: { title: 'Our Organic Collection' } },
      { id: 'og4', type: 'gallery', isVisible: true, order: 4, data: { title: 'From Our Fields To Your Table', images: [] } },
      { id: 'og5', type: 'testimonials', isVisible: true, order: 5, data: { title: 'What Our Community Says', reviews: [] } },
      { id: 'og6', type: 'newsletter', isVisible: true, order: 6, data: { title: 'Join The Organic Movement' } },
      { id: 'og7', type: 'footer', isVisible: true, order: 7, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  },
  'fruit-fresh': {
    theme: 'fruit-fresh',
    appearance: { colors: { primary: '#f97316', secondary: '#ec4899', background: '#fff7ed', text: '#7c2d12' } },
    sections: [
      { id: 'ff1', type: 'hero', isVisible: true, order: 1, data: { title: "Nature's Sweetest Harvest", subtitle: '' } },
      { id: 'ff2', type: 'categories', isVisible: true, order: 2, data: { title: 'Shop by Fruit Type' } },
      { id: 'ff3', type: 'featured-products', isVisible: true, order: 3, data: { title: 'Fresh Picks For You' } },
      { id: 'ff4', type: 'features', isVisible: true, order: 4, data: { title: 'The Freshest Promise', subtitle: '', features: [] } },
      { id: 'ff5', type: 'gallery', isVisible: true, order: 5, data: { title: 'A Rainbow of Freshness', images: [] } },
      { id: 'ff6', type: 'promo-banner', isVisible: true, order: 6, data: { title: 'Summer Special: 20% Off' } },
      { id: 'ff7', type: 'testimonials', isVisible: true, order: 7, data: { title: 'What Fruit Lovers Say', reviews: [] } },
      { id: 'ff8', type: 'newsletter', isVisible: true, order: 8, data: { title: 'Get The Juicy Details' } },
      { id: 'ff9', type: 'footer', isVisible: true, order: 9, data: { copyrightText: '© {year} {tenant}. All rights reserved.', showSocialLinks: true } }
    ]
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeId = searchParams.get('theme');

  if (!themeId || !defaults[themeId]) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  return NextResponse.json(defaults[themeId]);
}
