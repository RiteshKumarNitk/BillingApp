import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { CUSTOMER_ORDER_LIMIT, CUSTOMER_ORDER_WINDOW_MS } from "@/lib/orders/limits";
import { createCustomerOrder } from "@/lib/orders/createCustomerOrder";
import { isDatabaseBusyError, DB_BUSY_RESPONSE } from "@/lib/dbErrors";
import { log } from "@/lib/logger";

// POST: Submit a new order request. Logged-in customers use their CustomerAccount session; guests
// (no account, per the CafeOS "Continue as Guest" checkout path) instead supply guestName/guestPhone
// directly in the body — this route is reachable without a session for that reason, so it's rate
// limited same as the other unauthenticated website-facing write endpoints.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isCustomerSession = !!session?.user?.id && session.user.role === "CUSTOMER";

    const { tenantId: tenantIdOrSlug, items, notes, tableToken, guestName, guestPhone, idempotencyKey } = await request.json();

    if (!isCustomerSession) {
      const ip = getClientIp(request);
      if (!checkRateLimit(`guest-order:${ip}`, 10, 10 * 60 * 1000)) {
        return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 });
      }
    } else if (!checkRateLimit(`customer-order:${session!.user.id}`, CUSTOMER_ORDER_LIMIT, CUSTOMER_ORDER_WINDOW_MS)) {
      // Logged-in customers were previously unlimited; same budget/key as the mobile app.
      return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 });
    }

    const result = await createCustomerOrder({
      tenantIdOrSlug,
      items,
      notes,
      tableToken,
      customerAccountId: isCustomerSession ? session!.user.id : undefined,
      guest: isCustomerSession ? undefined : { name: guestName, phone: guestPhone },
      // Per-checkout-attempt key from the website cart — makes double-submits/retries return the
      // original order (guests included) instead of creating duplicates.
      idempotencyKey: request.headers.get("idempotency-key") || idempotencyKey || undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

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

// GET: List customer's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.orderRequest.findMany({
      where: { customerAccountId: session.user.id },
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
