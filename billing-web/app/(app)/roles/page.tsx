import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getRoles } from "@/lib/actions/roles";
import RolesClient from "./RolesClient";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  const authorized = await hasPermission('MANAGE_USERS');
  
  if (!authorized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to view or manage roles.</p>
        </div>
      </div>
    );
  }

  const roles = await getRoles();

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Roles & Permissions</h1>
            <p className="mt-1 text-sm text-gray-500">Manage what your team members can see and do</p>
          </div>
        </header>

        <RolesClient initialRoles={roles} />
      </div>
    </div>
  );
}
