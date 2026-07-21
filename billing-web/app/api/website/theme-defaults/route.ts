import { NextResponse } from 'next/server';
import { getThemeDefaultConfig } from '@/lib/website/themeDefaults';

const VALID_THEME_IDS = ['premium-food', 'modern-restaurant', 'fashion-store', 'fresh-harvest', 'organic-grove', 'fruit-fresh', 'minimal-cafe', 'modern-coffee'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeId = searchParams.get('theme');

  if (!themeId || !VALID_THEME_IDS.includes(themeId)) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  return NextResponse.json(getThemeDefaultConfig(themeId));
}
