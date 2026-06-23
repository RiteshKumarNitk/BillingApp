import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import PlansClient from "./PlansClient";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { amount: "asc" }
  });

  return (
    <div className="font-sans max-w-6xl mx-auto py-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and manage subscription packages, pricing, intervals, and resource limits</p>
        </div>
      </header>

      <PlansClient plans={plans} />
    </div>
  );
}
