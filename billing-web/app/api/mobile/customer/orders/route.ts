import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "billing-app-secret-key";

function verifyToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "CUSTOMER") return null;
    return decoded.id;
  } catch {
    return null;
  }
}

// GET: List customer's orders
export async function GET(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
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

// POST: Submit a new order request
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, items, notes } = await request.json();

    if (!tenantId || !items || items.length === 0) {
      return NextResponse.json({ error: "Tenant and items are required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
    }

    let totalAmount = 0;
    let taxAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) continue;

      let salePrice = product.salePrice;
      let itemName = product.name;

      if (item.variantId) {
        const variant = product.variants.find((v: any) => v.id === item.variantId);
        if (variant) {
          salePrice = variant.salePrice;
          itemName = `${product.name} - ${variant.name}`;
        }
      }

      const itemTotal = salePrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        name: itemName,
        barcode: product.barcode || "",
        salePrice,
        quantity: item.quantity,
        itemTotal,
      });
    }

    const shop = await prisma.shop.findUnique({ where: { tenantId } });
    const taxRate = shop?.defaultTaxRate || 0;
    taxAmount = totalAmount * (taxRate / 100);
    const netAmount = totalAmount + taxAmount;

    let customer = await prisma.customer.findFirst({
      where: { tenantId, customerAccountId },
    });

    if (!customer) {
      const account = await prisma.customerAccount.findUnique({ where: { id: customerAccountId } });
      customer = await prisma.customer.create({
        data: {
          name: account?.name || "Customer",
          email: account?.email,
          phone: account?.phone,
          tenantId,
          customerAccountId,
        },
      });
    }

    const orderRequest = await prisma.orderRequest.create({
      data: {
        status: "PENDING",
        notes: notes || null,
        totalAmount,
        taxAmount,
        netAmount,
        tenantId,
        customerAccountId,
        customerId: customer.id,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // Send push notification to customer
    sendPushNotification(
      customerAccountId,
      "Order Received!",
      `Your order of ₹${netAmount.toFixed(2)} has been submitted. Awaiting store confirmation.`,
      { type: "ORDER_STATUS", orderId: orderRequest.id, status: "PENDING" }
    ).catch(() => {}); // Fire and forget

    return NextResponse.json({
      message: "Order submitted successfully",
      order: orderRequest,
    }, { status: 201 });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
