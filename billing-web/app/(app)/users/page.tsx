import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getTenantUsers } from "@/lib/actions/users";
import { getRoles } from "@/lib/actions/roles";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
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
          <p>You do not have permission to view or manage users.</p>
        </div>
      </div>
    );
  }

  const users = await getTenantUsers();
  const roles = await getRoles();

  return (
    <div className="font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Team Members</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your staff and assign their roles</p>
          </div>
        </header>

        <UsersClient initialUsers={users} roles={roles} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
