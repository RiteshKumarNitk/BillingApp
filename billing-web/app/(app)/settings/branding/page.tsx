import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BrandingClient from "./BrandingClient";

export default async function BrandingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  });

  if (!tenant) {
    redirect("/auth/login");
  }

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto font-sans">
      <BrandingClient tenant={tenant} />
    </div>
  );
}
