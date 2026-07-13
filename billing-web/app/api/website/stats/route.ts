import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalVisits, todayVisits, weeklyVisits, monthlyVisits, totalLeads, unreadLeads, recentVisits, recentLeads, topPaths] = await Promise.all([
    prisma.websiteVisit.count({ where: { tenantId } }),
    prisma.websiteVisit.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
    prisma.websiteVisit.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.websiteVisit.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.contactLead.count({ where: { tenantId } }),
    prisma.contactLead.count({ where: { tenantId, read: false } }),
    prisma.websiteVisit.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.contactLead.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.websiteVisit.groupBy({
      by: ['path'],
      where: { tenantId },
      _count: true,
      orderBy: { _count: { path: 'desc' } },
      take: 10
    })
  ]);

  return NextResponse.json({
    totalVisits,
    todayVisits,
    weeklyVisits,
    monthlyVisits,
    totalLeads,
    unreadLeads,
    recentVisits,
    recentLeads,
    topPaths: topPaths.map(p => ({ path: p.path, count: p._count }))
  });
}
