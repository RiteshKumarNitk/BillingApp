import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, name, email, phone, subject, message, source } = await req.json();
    if (!tenantId || !name || !email || !message) {
      return NextResponse.json({ error: 'tenantId, name, email, and message are required' }, { status: 400 });
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
