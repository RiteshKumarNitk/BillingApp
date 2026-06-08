import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// GET: List stores the customer has ordered from
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerAccountId = session.user.id;

    // Get distinct stores from orders
    const storeOrders = await prisma.orderRequest.groupBy({
      by: ["tenantId"],
      where: { customerAccountId },
      _count: { id: true },
      _sum: { netAmount: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
    });

    const storeIds = storeOrders.map((s) => s.tenantId);
    const stores = await prisma.tenant.findMany({
      where: { id: { in: storeIds } },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        phone: true,
        menuTheme: true,
      },
    });

    // Get loyalty points per store
    const customerRecords = await prisma.customer.findMany({
      where: { customerAccountId },
      select: { tenantId: true, loyaltyPoints: true, totalSpent: true },
    });

    const result = storeOrders.map((so) => {
      const store = stores.find((s) => s.id === so.tenantId);
      const customerRec = customerRecords.find((c) => c.tenantId === so.tenantId);
      return {
        id: so.tenantId,
        name: store?.name || "Unknown Store",
        logoUrl: store?.logoUrl,
        address: store?.address,
        phone: store?.phone,
        menuTheme: store?.menuTheme,
        orderCount: so._count.id,
        totalSpent: so._sum.netAmount || 0,
        loyaltyPoints: customerRec?.loyaltyPoints || 0,
        lastOrderDate: so._max.createdAt,
      };
    });

    return NextResponse.json({ stores: result });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
