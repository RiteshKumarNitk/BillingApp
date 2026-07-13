import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, path, referrer, pageTitle } = await req.json();
    if (!tenantId || !path) {
      return NextResponse.json({ error: 'tenantId and path are required' }, { status: 400 });
    }

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
