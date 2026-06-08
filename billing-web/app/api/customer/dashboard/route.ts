import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerAccountId = session.user.id;

    // Get order stats
    const [totalOrders, pendingOrders, completedOrders, rejectedOrders] = await Promise.all([
      prisma.orderRequest.count({ where: { customerAccountId } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "PENDING" } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "APPROVED" } }),
      prisma.orderRequest.count({ where: { customerAccountId, status: "REJECTED" } }),
    ]);

    // Get total spent
    const spentResult = await prisma.orderRequest.aggregate({
      where: { customerAccountId, status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { netAmount: true },
    });
    const totalSpent = spentResult._sum.netAmount || 0;

    // Get stores ordered from
    const storeOrders = await prisma.orderRequest.groupBy({
      by: ["tenantId"],
      where: { customerAccountId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Get store names
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

    // Get loyalty points across all customer records
    const loyaltyResult = await prisma.customer.aggregate({
      where: { customerAccountId },
      _sum: { loyaltyPoints: true },
    });
    const loyaltyPoints = loyaltyResult._sum.loyaltyPoints || 0;

    // Recent orders (last 5)
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
