import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { ToastProvider } from "@/components/ui/Toast";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Fetch tenant info
  let tenant: any = null;
  try {
    tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId }
    });
  } catch (e) {
    console.error("Failed to fetch tenant:", e);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar user={session.user} tenant={tenant} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNav user={session.user} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ToastProvider>
              {children}
            </ToastProvider>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
