import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch the current tenant's settings
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  });

  if (!tenant) {
    return <div>Error: Tenant not found</div>;
  }

  return (
    <div className="font-sans mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your business profile and preferences.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-4">Business Information</h2>
        <SettingsForm initialData={tenant} />
      </div>
    </div>
  );
}
