import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import KitchenQueueClient from './KitchenQueueClient';

export default async function KitchenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  return <KitchenQueueClient />;
}
