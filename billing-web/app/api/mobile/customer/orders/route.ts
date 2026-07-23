import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";
import { createCustomerOrder } from "@/lib/orders/createCustomerOrder";

// GET: List customer's orders
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.orderRequest.findMany({
      where: { customerAccountId },
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

    const { tenantId, items, notes, tableToken } = await request.json();

    const result = await createCustomerOrder({
      tenantIdOrSlug: tenantId,
      items,
      notes,
      tableToken,
      customerAccountId,
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
