import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      select: { id: true, name: true, logoUrl: true, address: true, phone: true },
    });

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
