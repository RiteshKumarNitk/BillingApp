import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";
import { createCustomerOrder } from "@/lib/orders/createCustomerOrder";
import { checkRateLimit } from "@/lib/rateLimit";
import { CUSTOMER_ORDER_LIMIT, CUSTOMER_ORDER_WINDOW_MS } from "@/lib/orders/limits";
import { isDatabaseBusyError, DB_BUSY_RESPONSE } from "@/lib/dbErrors";
import { log } from "@/lib/logger";

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

    // P4: optional cursor pagination — `nextCursor` is returned when older orders exist; pass it
    // back as `?cursor=` for the next page. Clients that ignore it get the newest 50 as before.
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "", 10) || 50, 1), 100);
    const cursor = searchParams.get("cursor");

    const page = await prisma.orderRequest.findMany({
      where: { customerAccountId, ...(statuses ? { status: { in: statuses } } : {}) },
      include: {
        items: true,
        tenant: { select: { name: true, logoUrl: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = page.length > limit;
    const orders = hasMore ? page.slice(0, limit) : page;

    return NextResponse.json({ orders, nextCursor: hasMore ? orders[orders.length - 1].id : null });
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

    // Customer accounts are free to create, so a logged-in customer is still an untrusted caller —
    // cap order spam against a cafe's queue (same key as the website checkout).
    if (!checkRateLimit(`customer-order:${customerAccountId}`, CUSTOMER_ORDER_LIMIT, CUSTOMER_ORDER_WINDOW_MS)) {
      return NextResponse.json({ error: "Too many orders. Please try again in a few minutes." }, { status: 429 });
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
    // Transient DB saturation → 503 + Retry-After; the order's idempotency key makes a retry safe.
    if (isDatabaseBusyError(error)) {
      log.warn("order.create_db_busy", { error });
      return NextResponse.json(DB_BUSY_RESPONSE.body, DB_BUSY_RESPONSE.init);
    }
    log.error("order.create_failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
