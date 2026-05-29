import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import TenantDashboard from '@/components/dashboard/TenantDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role === 'SUPERADMIN') {
    return <SuperAdminDashboard />;
  }

  return <TenantDashboard searchParams={searchParams} tenantId={session.user.tenantId} />;
}