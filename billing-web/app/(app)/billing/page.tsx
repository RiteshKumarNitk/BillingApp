import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import GenericBillingClient from './GenericBillingClient';
import CafeBillingClient from './CafeBillingClient';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { businessType: true }
  });

  if (tenant?.businessType === 'CAFE') {
    return <CafeBillingClient />;
  }

  return <GenericBillingClient />;
}
