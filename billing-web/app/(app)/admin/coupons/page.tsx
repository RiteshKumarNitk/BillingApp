import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import CouponsClient from "./CouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="font-sans max-w-6xl mx-auto py-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional offers and discount coupon codes for subscriptions</p>
        </div>
      </header>

      <CouponsClient coupons={coupons} />
    </div>
  );
}
