import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // "PENDING"/"COMPLETED"/"REJECTED" are the only statuses any code path writes today.
    // ACCEPTED/PREPARING/READY/CANCELLED (added in the CafeOS Phase 2 schema) aren't produced by
    // any current flow, so they're not split out separately here yet.
    const [totalOrders, pendingOrders, completedOrders, rejectedOrders] = await Promise.all([
      prisma.orderRequest.count({ where: { customerAccountId } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "PENDING" } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "COMPLETED" } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "REJECTED" } }),
    ]);

    const spentResult = await prisma.orderRequest.aggregate({
      where: { customerAccountId, status: "COMPLETED" },
      _sum: { netAmount: true },
    });
    const totalSpent = spentResult._sum.netAmount || 0;

    const storeOrders = await prisma.orderRequest.groupBy({
      by: ["tenantId"],
      where: { customerAccountId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const storeIds = storeOrders.map((s) => s.tenantId);
    const stores = await prisma.tenant.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, logoUrl: true, address: true },
    });

    const storesWithOrders = storeOrders.map((so) => {
      const store = stores.find((s) => s.id === so.tenantId);
      return {
        id: so.tenantId,
        name: store?.name || "Unknown Store",
        logoUrl: store?.logoUrl,
        address: store?.address,
        orderCount: so._count.id,
      };
    });

    const loyaltyResult = await prisma.customer.aggregate({
      where: { customerAccountId },
      _sum: { loyaltyPoints: true },
    });
    const loyaltyPoints = loyaltyResult._sum.loyaltyPoints || 0;

    const recentOrders = await prisma.orderRequest.findMany({
      where: { customerAccountId },
      include: {
        items: true,
        tenant: { select: { name: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        rejectedOrders,
        totalSpent,
        loyaltyPoints,
        storesOrderedFrom: storesWithOrders.length,
      },
      stores: storesWithOrders,
      recentOrders,
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
