import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// GET: List order requests for a tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const orders = await prisma.orderRequest.findMany({
      where: {
        tenantId: session.user.tenantId,
        status,
      },
      include: {
        items: true,
        customerAccount: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Get counts for each status
    const counts = await prisma.orderRequest.groupBy({
      by: ["status"],
      where: { tenantId: session.user.tenantId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => { statusCounts[c.status] = c._count; });

    return NextResponse.json({ orders, statusCounts });
  } catch (error) {
    console.error("Error fetching tenant orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
