import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "billing-app-secret-key";

function verifyToken(request: NextRequest): { id: string; tenantId: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; tenantId: string; role: string };
    if (decoded.role === "CUSTOMER") return null;
    return { id: decoded.id, tenantId: decoded.tenantId };
  } catch {
    return null;
  }
}

// PATCH: Approve or reject an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const order = await prisma.orderRequest.findFirst({
      where: { id, tenantId: auth.tenantId, status: "PENDING" },
      include: { items: true, customerAccount: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { name: true },
    });

    if (action === "REJECT") {
      await prisma.$transaction(async (tx) => {
        await tx.orderRequest.update({ where: { id }, data: { status: "REJECTED" } });
        // Guest orders (no CustomerAccount) have no in-app notification/push target.
        if (order.customerAccountId) {
          await tx.notification.create({
            data: {
              type: "ORDER_REJECTED",
              title: "Order Rejected",
              message: `${tenant?.name || "The store"} has rejected your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}`,
              orderId: id,
              tenantId: auth.tenantId,
              customerAccountId: order.customerAccountId,
              customerId: order.customerId || null,
            },
          });
        }
      });

      // Send push notification
      if (order.customerAccountId) {
        sendPushNotification(
          order.customerAccountId,
          "Order Rejected",
          `${tenant?.name || "The store"} has rejected your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}`,
          { type: "ORDER_STATUS", orderId: id, status: "REJECTED" }
        ).catch(() => {});
      }

      return NextResponse.json({ message: "Order rejected" });
    }

    // APPROVE: Create transaction, update stock, create notification
    const transaction = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.id,
          status: "COMPLETED",
          totalAmount: order.totalAmount,
          discount: 0,
          discountType: "PERCENTAGE",
          taxAmount: order.taxAmount,
          netAmount: order.netAmount,
          paymentMethod: "PENDING",
          customerId: order.customerId,
          customerName: order.customerAccount?.name || "Customer",
          customerPhone: order.customerAccount?.phone || null,
          notes: `Online order #${order.id.slice(0, 8)}`,
          items: {
            create: order.items.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              barcode: item.barcode,
              purchasePrice: 0,
              mrp: item.salePrice,
              salePrice: item.salePrice,
              quantity: item.quantity,
              itemTotal: item.itemTotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { increment: order.netAmount },
            lastPurchaseDate: new Date(),
            loyaltyPoints: { increment: Math.floor(order.netAmount / 10) },
          },
        });
      }

      await tx.orderRequest.update({ where: { id }, data: { status: "COMPLETED", transactionId: txn.id } });

      // Guest orders (no CustomerAccount) have no in-app notification/push target.
      if (order.customerAccountId) {
        await tx.notification.create({
          data: {
            type: "ORDER_APPROVED",
            title: "Order Approved!",
            message: `${tenant?.name || "The store"} has approved your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}. Your order is being prepared!`,
            orderId: id,
            tenantId: auth.tenantId,
            customerAccountId: order.customerAccountId,
            customerId: order.customerId || null,
          },
        });
      }

      return txn;
    });

    // Send push notification
    if (order.customerAccountId) {
      sendPushNotification(
        order.customerAccountId,
        "Order Approved!",
        `${tenant?.name || "The store"} has approved your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}. Your order is being prepared!`,
        { type: "ORDER_STATUS", orderId: id, status: "COMPLETED" }
      ).catch(() => {});
    }

    return NextResponse.json({ message: "Order approved and invoice generated", transaction });
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
