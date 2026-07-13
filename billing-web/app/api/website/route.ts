import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';
import { WebsiteConfig } from '@/lib/website/types';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const config: WebsiteConfig = await request.json();

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
      },
      update: {
        theme: config.theme,
        appearance: config.appearance as Prisma.InputJsonValue,
        seo: config.seo as Prisma.InputJsonValue,
        businessInfo: config.businessInfo as Prisma.InputJsonValue,
        sections: (config.sections ?? []) as unknown as Prisma.InputJsonValue,
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
