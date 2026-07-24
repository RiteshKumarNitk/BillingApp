import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";
import { createCustomerOrder } from "@/lib/orders/createCustomerOrder";

// Bucketed for the "My Orders" tabs — status is a free-form string (see schema comment on
// OrderRequest.status), so bucketing happens here rather than via a Prisma enum.
const STATUS_BUCKETS: Record<string, string[]> = {
  upcoming: ["PENDING"],
  active: ["ACCEPTED", "PREPARING", "READY"],
  completed: ["COMPLETED"],
  cancelled: ["REJECTED", "CANCELLED"],
};

// GET: List customer's orders, optionally filtered to one status bucket
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("status");
    const statuses = bucket ? STATUS_BUCKETS[bucket] : undefined;
    if (bucket && !statuses) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    const orders = await prisma.orderRequest.findMany({
      where: { customerAccountId, ...(statuses ? { status: { in: statuses } } : {}) },
      include: {
        items: true,
        tenant: { select: { name: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit a new order request. Guest checkout stays web-only (matches the cookie-based
// route) — the mobile app always requires a logged-in customer.
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, items, notes, tableToken, idempotencyKey } = await request.json();

    const result = await createCustomerOrder({
      tenantIdOrSlug: tenantId,
      items,
      notes,
      tableToken,
      customerAccountId,
      idempotencyKey,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Send push notification to customer
    sendPushNotification(
      customerAccountId,
      "Order Received!",
      `Your order of ₹${result.order.netAmount.toFixed(2)} has been submitted. Awaiting store confirmation.`,
      { type: "ORDER_STATUS", orderId: result.order.id, status: "PENDING" }
    ).catch(() => {}); // Fire and forget

    return NextResponse.json({
      message: "Order submitted successfully",
      order: result.order,
    }, { status: 201 });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
