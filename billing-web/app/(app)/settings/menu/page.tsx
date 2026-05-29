import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import MenuSettingsClient from "./MenuSettingsClient";

export default async function MenuSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/auth/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  });

  if (!tenant) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Digital Menu & QR Code</h1>
      <p className="text-gray-500 mb-8">Generate and print the static QR code for your public digital menu.</p>
      
      <MenuSettingsClient 
        tenantId={tenant.id} 
        address={tenant.address || ""} 
        initialTheme={tenant.menuTheme || "DEFAULT"} 
      />
    </div>
  );
}
