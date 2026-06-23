import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { History, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      tenant: true,
      user: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="font-sans max-w-6xl mx-auto py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Audit log records of platform actions, payments, subscription changes, and billing activities</p>
      </header>

      {/* Logs Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Business Tenant</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Operator</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {log.tenant?.name || "System administration"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {log.user?.email || "System Automated"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                      log.action.includes("FAIL") || log.action.includes("CANCEL") || log.action.includes("HALT")
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-1.5">
                      <ShieldAlert className="w-10 h-10 text-gray-300" />
                      <span>No system audit logs found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
