import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// PATCH: Approve or reject an order
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
    const { action } = await request.json(); // "APPROVE" or "REJECT"

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify the order belongs to this tenant
    const order = await prisma.orderRequest.findFirst({
      where: { id, tenantId: session.user.tenantId, status: "PENDING" },
      include: { items: true, customerAccount: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });

    if (action === "REJECT") {
      await prisma.$transaction(async (tx) => {
        await tx.orderRequest.update({
          where: { id },
          data: { status: "REJECTED" },
        });

        // Create notification for the customer
        await tx.notification.create({
          data: {
            type: "ORDER_REJECTED",
            title: "Order Rejected",
            message: `${tenant?.name || "The store"} has rejected your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}`,
            orderId: id,
            tenantId: session.user.tenantId,
            customerAccountId: order.customerAccountId,
            customerId: order.customerId || null,
          },
        });
      });

      return NextResponse.json({ message: "Order rejected" });
    }

    // APPROVE: Create a transaction from the order
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
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

      // Update stock for each product
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Update customer totalSpent and loyalty points
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

      // Update the order request
      await tx.orderRequest.update({
        where: { id },
        data: { status: "COMPLETED", transactionId: txn.id },
      });

      // Create notification for the customer
      await tx.notification.create({
        data: {
          type: "ORDER_APPROVED",
          title: "Order Approved!",
          message: `${tenant?.name || "The store"} has approved your order #${id.slice(0, 8)}. Total: ₹${order.netAmount.toFixed(2)}. Your order is being prepared!`,
          orderId: id,
          tenantId: session.user.tenantId,
          customerAccountId: order.customerAccountId,
          customerId: order.customerId || null,
        },
      });

      return txn;
    });

    return NextResponse.json({
      message: "Order approved and invoice generated",
      transaction,
    });
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
