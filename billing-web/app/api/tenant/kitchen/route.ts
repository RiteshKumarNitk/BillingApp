import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// Per source (online / POS). A real kitchen board shows tens of tickets; this only bites when a
// backlog of never-closed orders builds up.
const KITCHEN_TICKET_CAP = 150;

export interface KitchenTicket {
  id: string; // "order:<uuid>" | "txn:<uuid>"
  source: "online" | "pos";
  displayId: string;
  status: "ACCEPTED" | "PREPARING" | "READY";
  tableLabel: string | null;
  orderType: string | null;
  customerName: string;
  notes: string | null;
  items: { name: string; quantity: number; comboComponents?: { name: string; variantName: string | null; quantity: number }[] }[];
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

    // Bounded: every kitchen screen polls this every 10s. Previously it returned EVERY active
    // ticket — a backlog of never-closed online orders made one poll 3.4 MB / 18–35 s in the load
    // test (11k tickets), stalling the whole instance. Oldest first is the kitchen's own priority,
    // so the cap never hides the most urgent tickets; totals below let the screen show "+N more".
    const onlineWhere = { tenantId, status: { in: ["ACCEPTED", "PREPARING", "READY"] } };
    const posWhere = { tenantId, kitchenStatus: { in: ["PREPARING", "READY"] } };
    const ticketItemSelect = { select: { name: true, quantity: true, comboComponents: true } };
    const [orderRequests, transactions, onlineTotal, posTotal] = await Promise.all([
      prisma.orderRequest.findMany({
        where: onlineWhere,
        select: {
          id: true, status: true, orderType: true, guestName: true, notes: true, createdAt: true,
          items: ticketItemSelect,
          table: { select: { label: true } },
          customerAccount: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: KITCHEN_TICKET_CAP,
      }),
      prisma.transaction.findMany({
        where: posWhere,
        select: {
          id: true, kitchenStatus: true, tableNumber: true, orderType: true, customerName: true, notes: true, createdAt: true,
          items: ticketItemSelect,
        },
        orderBy: { createdAt: "asc" },
        take: KITCHEN_TICKET_CAP,
      }),
      prisma.orderRequest.count({ where: onlineWhere }),
      prisma.transaction.count({ where: posWhere }),
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
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        comboComponents: Array.isArray(i.comboComponents) ? (i.comboComponents as any) : undefined,
      })),
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
      items: t.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        comboComponents: Array.isArray(i.comboComponents) ? (i.comboComponents as any) : undefined,
      })),
      createdAt: t.createdAt.toISOString(),
    }));

    const tickets = [...onlineTickets, ...posTickets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const hiddenCount = Math.max(0, onlineTotal - orderRequests.length) + Math.max(0, posTotal - transactions.length);
    return NextResponse.json({ tickets, totalActive: onlineTotal + posTotal, hiddenCount });
  } catch (error) {
    console.error("Error fetching kitchen tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
