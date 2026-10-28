import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// POS tickets skip the accept/reject step online orders need (a walk-in sale is already decided
// and paid), so this only covers the kitchen-prep leg: PREPARING -> READY -> SERVED (SERVED drops
// it off the queue — no billing side effect, the Transaction was already completed at checkout).
const NEXT_STATUS: Record<string, string> = {
  PREPARING: "READY",
  READY: "SERVED",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const txn = await prisma.transaction.findFirst({ where: { id, tenantId: session.user.tenantId } });
    if (!txn || !txn.kitchenStatus || !NEXT_STATUS[txn.kitchenStatus]) {
      return NextResponse.json({ error: "Ticket not found or not in a valid state" }, { status: 404 });
    }

    // Compare-and-set on the status we just read, so a double click advances exactly one stage
    // instead of skipping one (PREPARING → READY → SERVED).
    const nextStatus = NEXT_STATUS[txn.kitchenStatus];
    const moved = await prisma.transaction.updateMany({
      where: { id, tenantId: session.user.tenantId, kitchenStatus: txn.kitchenStatus },
      data: { kitchenStatus: nextStatus },
    });
    if (moved.count === 0) {
      return NextResponse.json({ error: "Ticket was already updated — refresh to see its current state" }, { status: 409 });
    }

    return NextResponse.json({ message: "Ticket updated", kitchenStatus: nextStatus });
  } catch (error) {
    console.error("Error updating kitchen ticket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
