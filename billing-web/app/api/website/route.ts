import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';
import { websiteConfigSchema } from '@/lib/website/schema';
import { checkThemeAllowed } from '@/lib/subscription';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const MAX_PAYLOAD_BYTES = 500_000;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden - only the store owner can edit the website' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const raw = await request.text();

    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Website configuration is too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const result = websiteConfigSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid website configuration', details: z.flattenError(result.error) }, { status: 400 });
    }
    const config = result.data;

    const themeCheck = await checkThemeAllowed(tenantId, config.theme);
    if (!themeCheck.allowed) {
      return NextResponse.json({ error: themeCheck.reason }, { status: 403 });
    }

    // Upsert the Website configuration
    const website = await prisma.website.upsert({
      where: { tenantId },
      create: {
        tenantId,
        theme: config.theme,
        appearance: config.appearance as Prisma.InputJsonValue,
        seo: config.seo as Prisma.InputJsonValue,
        businessInfo: config.businessInfo as Prisma.InputJsonValue,
        sections: (config.sections ?? []) as unknown as Prisma.InputJsonValue,
        pages: config.pages as Prisma.InputJsonValue,
      },
      update: {
        theme: config.theme,
        appearance: config.appearance as Prisma.InputJsonValue,
        seo: config.seo as Prisma.InputJsonValue,
        businessInfo: config.businessInfo as Prisma.InputJsonValue,
        sections: (config.sections ?? []) as unknown as Prisma.InputJsonValue,
        pages: config.pages as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, website });
  } catch (error: any) {
    console.error('Website save error:', error);
    return NextResponse.json(
      { error: 'Failed to save website configuration' },
      { status: 500 }
    );
  }
}
