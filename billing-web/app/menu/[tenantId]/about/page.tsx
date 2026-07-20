import { redirect } from 'next/navigation';

export default async function MenuAboutPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  redirect(`/site/${tenantId}/about`);
}
