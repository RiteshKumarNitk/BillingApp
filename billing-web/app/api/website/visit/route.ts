import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { websiteVisitSchema } from '@/lib/website/schema';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`visit:${ip}`, 60, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const result = websiteVisitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { tenantId, path, referrer, pageTitle } = result.data;

    const website = await prisma.website.findUnique({ where: { tenantId } });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    await prisma.websiteVisit.create({
      data: { websiteId: website.id, tenantId, path, referrer: referrer || null, pageTitle: pageTitle || null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log visit:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
