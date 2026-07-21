import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

// Order lifecycle: PENDING -> (ACCEPT | HOLD | REJECT). ACCEPTED orders then move through the
// Kitchen Queue (Phase 9): ACCEPTED -> PREPARING -> READY -> COMPLETE (this last step is where the
// Transaction/invoice is actually created — moved out of ACCEPT so "we're making it" and "it's
// billed" are no longer the same action, which is what a real kitchen stage needs). CANCEL is
// reachable from anything not yet COMPLETED/REJECTED.
const TRANSITIONS: Record<string, { from: string[]; to: string; notify?: { type: string; title: string; message: (order: any, tenantName: string) => string } }> = {
  ACCEPT: {
    from: ["PENDING", "ON_HOLD"],
    to: "ACCEPTED",
    notify: {
      type: "ORDER_APPROVED",
      title: "Order Accepted!",
      message: (order, tenantName) => `${tenantName} has accepted your order #${order.id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}.`,
    },
  },
  HOLD: {
    from: ["PENDING"],
    to: "ON_HOLD",
  },
  REJECT: {
    from: ["PENDING", "ON_HOLD"],
    to: "REJECTED",
    notify: {
      type: "ORDER_REJECTED",
      title: "Order Rejected",
      message: (order, tenantName) => `${tenantName} has rejected your order #${order.id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}.`,
    },
  },
  START_PREPARING: {
    from: ["ACCEPTED"],
    to: "PREPARING",
    notify: {
      type: "ORDER_STATUS",
      title: "Being Prepared",
      message: (order, tenantName) => `${tenantName} is preparing your order #${order.id.slice(0, 8)}.`,
    },
  },
  MARK_READY: {
    from: ["PREPARING"],
    to: "READY",
    notify: {
      type: "ORDER_STATUS",
      title: "Order Ready!",
      message: (order, tenantName) => `Your order #${order.id.slice(0, 8)} from ${tenantName} is ready.`,
    },
  },
  CANCEL: {
    from: ["PENDING", "ON_HOLD", "ACCEPTED", "PREPARING", "READY"],
    to: "CANCELLED",
    notify: {
      type: "ORDER_STATUS",
      title: "Order Cancelled",
      message: (order, tenantName) => `${tenantName} has cancelled your order #${order.id.slice(0, 8)}.`,
    },
  },
};

// PATCH: advance an order through its lifecycle
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
    const { action } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });
    const tenantName = tenant?.name || "The store";

    if (action === "COMPLETE") {
      const order = await prisma.orderRequest.findFirst({
        where: { id, tenantId: session.user.tenantId, status: "READY" },
        include: { items: true, customerAccount: true, customer: true, table: true },
      });
      if (!order) {
        return NextResponse.json({ error: "Order not found or not ready to complete" }, { status: 404 });
      }

      const transaction = await prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.create({
          data: {
            tenantId: session.user.tenantId,
            userId: session.user.id,
            status: "COMPLETED",
            totalAmount: order.totalAmount,
            discount: 0,
            discountType: "PERCENTAGE",
            taxAmount: order.taxAmount,
            netAmount: order.netAmount,
            paymentMethod: "PENDING",
            customerId: order.customerId,
            customerName: order.customerAccount?.name || order.guestName || "Customer",
            customerPhone: order.customerAccount?.phone || order.guestPhone || null,
            tableNumber: order.table?.label || null,
            orderType: order.orderType,
            notes: `Online order #${order.id.slice(0, 8)}${order.guestName ? " (Guest)" : ""}`,
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

        await tx.orderRequest.update({
          where: { id },
          data: { status: "COMPLETED", transactionId: txn.id },
        });

        if (order.customerAccountId) {
          await tx.notification.create({
            data: {
              type: "ORDER_APPROVED",
              title: "Order Completed!",
              message: `Your order #${id.slice(0, 8)} from ${tenantName} is complete. Total: ₹${order.netAmount.toFixed(2)}.`,
              orderId: id,
              tenantId: session.user.tenantId,
              customerAccountId: order.customerAccountId,
              customerId: order.customerId || null,
            },
          });
        }

        return txn;
      });

      if (order.customerAccountId) {
        sendPushNotification(
          order.customerAccountId,
          "Order Completed!",
          `Your order #${id.slice(0, 8)} from ${tenantName} is complete. Total: ₹${order.netAmount.toFixed(2)}.`,
          { type: "ORDER_STATUS", orderId: id, status: "COMPLETED" }
        ).catch(() => {});
      }

      return NextResponse.json({ message: "Order completed and invoice generated", transaction });
    }

    const transition = TRANSITIONS[action];
    if (!transition) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const order = await prisma.orderRequest.findFirst({
      where: { id, tenantId: session.user.tenantId, status: { in: transition.from } },
      include: { items: true, customerAccount: true, customer: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found or not in a valid state for this action" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderRequest.update({ where: { id }, data: { status: transition.to } });

      // Guest orders (no CustomerAccount) have no in-app notification/push target.
      if (transition.notify && order.customerAccountId) {
        await tx.notification.create({
          data: {
            type: transition.notify.type,
            title: transition.notify.title,
            message: transition.notify.message(order, tenantName),
            orderId: id,
            tenantId: session.user.tenantId,
            customerAccountId: order.customerAccountId,
            customerId: order.customerId || null,
          },
        });
      }
    });

    if (transition.notify && order.customerAccountId) {
      sendPushNotification(
        order.customerAccountId,
        transition.notify.title,
        transition.notify.message(order, tenantName),
        { type: "ORDER_STATUS", orderId: id, status: transition.to }
      ).catch(() => {});
    }

    return NextResponse.json({ message: `Order ${transition.to.toLowerCase()}` });
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: tenant removes an order (used for stray/duplicate requests, distinct from REJECT which
// notifies the customer)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const order = await prisma.orderRequest.findFirst({ where: { id, tenantId: session.user.tenantId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    await prisma.orderRequestItem.deleteMany({ where: { orderRequestId: id } });
    await prisma.orderRequest.delete({ where: { id } });
    return NextResponse.json({ message: "Order deleted" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
