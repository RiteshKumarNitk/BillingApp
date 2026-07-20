import { redirect } from 'next/navigation';

export default async function MenuContactPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  redirect(`/site/${tenantId}/contact`);
}
