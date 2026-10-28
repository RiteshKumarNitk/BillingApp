import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Tenant isolation: previously any logged-in user of ANY tenant could pass another tenant's id
  // and read its visit stats and recent contact leads (names/emails/phones/messages). The tenant
  // now comes from the session; only a superadmin may inspect a different tenant.
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const requested = req.nextUrl.searchParams.get('tenantId');
  const isSuperAdmin = session.user.role === 'SUPERADMIN';
  if (requested && requested !== session.user.tenantId && !isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const tenantId = isSuperAdmin && requested ? requested : session.user.tenantId;

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
    // Last 30 days only: an all-time GROUP BY over the fastest-growing table (one row per page
    // view) got linearly slower forever.
    prisma.websiteVisit.groupBy({
      by: ['path'],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
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
