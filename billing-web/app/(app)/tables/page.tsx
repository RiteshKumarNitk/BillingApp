import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getTables } from '@/lib/actions/tables';
import TablesClient from './TablesClient';

export default async function TablesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, websiteSlug: true },
  });

  const tables = await getTables();

  return <TablesClient tables={tables} siteId={tenant?.websiteSlug || tenant?.id || session.user.tenantId} />;
}
