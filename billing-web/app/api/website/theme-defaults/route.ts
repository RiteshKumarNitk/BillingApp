import { NextResponse } from 'next/server';
import { getThemeDefaultConfig, THEME_DEFINITIONS } from '@/lib/website/themeDefinitions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themeId = searchParams.get('theme');

  if (!themeId || !THEME_DEFINITIONS.some((t) => t.id === themeId)) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  return NextResponse.json(getThemeDefaultConfig(themeId));
}
