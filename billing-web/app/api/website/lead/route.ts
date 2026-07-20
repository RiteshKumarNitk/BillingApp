import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { contactLeadSchema } from '@/lib/website/schema';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`lead:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const result = contactLeadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }
    const { tenantId, name, email, phone, subject, message, source } = result.data;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const lead = await prisma.contactLead.create({
      data: { tenantId, name, email, phone: phone || null, subject: subject || null, message, source: source || 'website' }
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error('Failed to save lead:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
