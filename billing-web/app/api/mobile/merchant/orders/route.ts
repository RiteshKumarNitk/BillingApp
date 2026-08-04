import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileUserFromAuthHeader } from "@/lib/auth/mobile";

function verifyToken(request: NextRequest): { id: string; tenantId: string } | null {
  const decoded = getMobileUserFromAuthHeader(request) as { id?: string; tenantId?: string; role?: string } | null;
  if (!decoded || !decoded.id || !decoded.tenantId || decoded.role === "CUSTOMER") return null;
  return { id: decoded.id, tenantId: decoded.tenantId };
}

// GET: List order requests for the merchant's tenant
export async function GET(request: NextRequest) {
  try {
    const auth = verifyToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const orders = await prisma.orderRequest.findMany({
      where: { tenantId: auth.tenantId, status },
      include: {
        items: true,
        customerAccount: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const counts = await prisma.orderRequest.groupBy({
      by: ["status"],
      where: { tenantId: auth.tenantId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    counts.forEach((c) => { statusCounts[c.status] = c._count; });

    return NextResponse.json({ orders, statusCounts });
  } catch (error) {
    console.error("Error fetching merchant orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
