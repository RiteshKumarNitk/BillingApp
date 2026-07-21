import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

export interface KitchenTicket {
  id: string; // "order:<uuid>" | "txn:<uuid>"
  source: "online" | "pos";
  displayId: string;
  status: "ACCEPTED" | "PREPARING" | "READY";
  tableLabel: string | null;
  orderType: string | null;
  customerName: string;
  notes: string | null;
  items: { name: string; quantity: number }[];
  createdAt: string;
}

// GET: the Kitchen Queue's unified ticket list — normalizes online orders (OrderRequest, already
// ACCEPTED via the Cafe Dashboard) and in-person POS sales (Transaction, sent to kitchen from the
// Cafe POS in Phase 10) into one shape so kitchen staff work off a single board regardless of
// where the order came from.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user.tenantId;

    const [orderRequests, transactions] = await Promise.all([
      prisma.orderRequest.findMany({
        where: { tenantId, status: { in: ["ACCEPTED", "PREPARING", "READY"] } },
        include: { items: true, table: true, customerAccount: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: { tenantId, kitchenStatus: { in: ["PREPARING", "READY"] } },
        include: { items: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const onlineTickets: KitchenTicket[] = orderRequests.map((o) => ({
      id: `order:${o.id}`,
      source: "online",
      displayId: o.id.slice(0, 8),
      status: o.status as KitchenTicket["status"],
      tableLabel: o.table?.label || null,
      orderType: o.orderType,
      customerName: o.customerAccount?.name || o.guestName || "Guest",
      notes: o.notes,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      createdAt: o.createdAt.toISOString(),
    }));

    const posTickets: KitchenTicket[] = transactions.map((t) => ({
      id: `txn:${t.id}`,
      source: "pos",
      displayId: t.id.slice(0, 8),
      status: (t.kitchenStatus as KitchenTicket["status"]) || "PREPARING",
      tableLabel: t.tableNumber,
      orderType: t.orderType,
      customerName: t.customerName || "Walk-in",
      notes: t.notes,
      items: t.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      createdAt: t.createdAt.toISOString(),
    }));

    const tickets = [...onlineTickets, ...posTickets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching kitchen tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
