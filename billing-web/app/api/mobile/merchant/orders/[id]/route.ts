import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { getMobileUserFromAuthHeader } from "@/lib/auth/mobile";
import { productTracksStock } from "@/lib/products/availability";
import { loyaltyPointsFor } from "@/lib/loyalty";

// Thrown when an order can't be approved because a managed-stock item doesn't have enough stock
// left. Thrown inside the $transaction so the whole approval rolls back (order stays PENDING)
// instead of silently selling negative stock.
class OrderApprovalError extends Error {}

async function verifyToken(request: NextRequest): Promise<{ id: string; tenantId: string } | null> {
  const decoded = await getMobileUserFromAuthHeader(request);
  if (!decoded || !decoded.id || !decoded.tenantId || decoded.role === "CUSTOMER") return null;
  return { id: decoded.id, tenantId: decoded.tenantId };
}

// PATCH: Approve or reject an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, paymentMethod } = await request.json();

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    // B1: optional here for backward compatibility with older staff-app builds; when given, the
    // sale is recorded with a real payment row (see the web COMPLETE handler for the full rule).
    if (paymentMethod !== undefined && !["CASH", "UPI", "CARD"].includes(paymentMethod)) {
      return NextResponse.json({ error: "paymentMethod must be CASH, UPI or CARD" }, { status: 400 });
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
        // Compare-and-set so a concurrent APPROVE and REJECT can't both apply.
        const moved = await tx.orderRequest.updateMany({
          where: { id, tenantId: auth.tenantId, status: "PENDING" },
          data: { status: "REJECTED" },
        });
        if (moved.count === 0) throw new OrderApprovalError("This order was already processed");
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

    const costProducts = await prisma.product.findMany({
      where: { id: { in: order.items.map((i) => i.productId) }, tenantId: auth.tenantId },
      select: { id: true, purchasePrice: true },
    });
    const costById = new Map(costProducts.map((p) => [p.id, p.purchasePrice]));

    // APPROVE: Create transaction, update stock, create notification
    const transaction = await prisma.$transaction(async (tx) => {
      // Atomic claim (PENDING → COMPLETED) so two concurrent approvals can't create two invoices.
      const claimed = await tx.orderRequest.updateMany({
        where: { id, tenantId: auth.tenantId, status: "PENDING" },
        data: { status: "COMPLETED" },
      });
      if (claimed.count === 0) throw new OrderApprovalError("This order was already processed");

      const txn = await tx.transaction.create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.id,
          status: "COMPLETED",
          totalAmount: order.totalAmount,
          discount: 0,
          discountType: "PERCENTAGE",
          couponDiscountAmount: order.discountAmount,
          // Recorded on the sale so a later invoice edit computes the loyalty delta from the real value
          // (it read 0 before, and would have credited these points a second time).
          loyaltyPointsEarned: order.customerId ? loyaltyPointsFor(order.netAmount) : 0,
          taxAmount: order.taxAmount,
          netAmount: order.netAmount,
          paymentMethod: paymentMethod || "PENDING",
          ...(paymentMethod
            ? {
                amountReceived: order.netAmount,
                changeAmount: 0,
                payments: { create: [{ method: paymentMethod, amount: order.netAmount }] },
              }
            : {}),
          customerId: order.customerId,
          customerName: order.customerAccount?.name || order.guestName || "Customer",
          customerPhone: order.customerAccount?.phone || order.guestPhone || null,
          notes: `Online order #${order.id.slice(0, 8)}${order.guestName ? " (Guest)" : ""}`,
          items: {
            create: order.items.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              barcode: item.barcode,
              purchasePrice: costById.get(item.productId) ?? 0,
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
        if (!product || !productTracksStock(product)) continue;
        // Atomic decrement with an in-condition stock guard (same pattern as the POS path in
        // lib/services/transactions.ts) so two concurrent approvals can't oversell.
        const result = await tx.product.updateMany({
          where: { id: item.productId, tenantId: auth.tenantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const current = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          throw new OrderApprovalError(
            `Insufficient stock for "${item.name}" to approve this order (${current?.stock ?? 0} left)`
          );
        }
      }

      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { increment: order.netAmount },
            lastPurchaseDate: new Date(),
            loyaltyPoints: { increment: loyaltyPointsFor(order.netAmount) },
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
    if (error instanceof OrderApprovalError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error processing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
