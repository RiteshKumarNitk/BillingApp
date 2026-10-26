import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// GET: List order requests for a tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    // P4: cursor pagination (newest first). Previously a hard `take: 100` with no way to see older
    // orders — a busy cafe's Completed tab silently stopped at the latest 100.
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "", 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const cursor = searchParams.get("cursor");

    const page = await prisma.orderRequest.findMany({
      where: {
        tenantId: session.user.tenantId,
        status,
      },
      include: {
        items: true,
        customerAccount: { select: { name: true, email: true, phone: true } },
        table: { select: { label: true } },
      },
      // id tiebreak keeps the order stable for orders created in the same millisecond.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = page.length > limit;
    const orders = hasMore ? page.slice(0, limit) : page;
    const nextCursor = hasMore ? orders[orders.length - 1].id : null;

    // Get counts for each status
    const counts = await prisma.orderRequest.groupBy({
      by: ["status"],
      where: { tenantId: session.user.tenantId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => { statusCounts[c.status] = c._count; });

    return NextResponse.json({ orders, statusCounts, nextCursor });
  } catch (error) {
    console.error("Error fetching tenant orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
