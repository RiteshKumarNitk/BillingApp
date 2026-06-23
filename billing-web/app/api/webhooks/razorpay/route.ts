import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRazorpayWebhook } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "dummy_secret";

    const isValid = verifyRazorpayWebhook(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payloadData = payload.payload;

    console.log(`[RAZORPAY WEBHOOK] Received event: ${event}`);

    if (event.startsWith("subscription.")) {
      const subscriptionObj = payloadData.subscription.entity;
      const rzpSubId = subscriptionObj.id;
      const notes = subscriptionObj.notes || {};
      const tenantId = notes.tenantId;

      if (!tenantId) {
        console.error(`[RAZORPAY WEBHOOK] Tenant ID not found in subscription notes for sub ${rzpSubId}`);
        return NextResponse.json({ message: "No tenantId in notes, ignored" }, { status: 200 });
      }

      // Find subscription in our DB
      const dbSub = await prisma.tenantSubscription.findFirst({
        where: { razorpaySubscriptionId: rzpSubId },
        include: { plan: true }
      });

      if (!dbSub) {
        console.error(`[RAZORPAY WEBHOOK] Subscription ${rzpSubId} not found in database`);
        return NextResponse.json({ message: "Subscription not found in DB, ignored" }, { status: 200 });
      }

      let newStatus = dbSub.status;
      let endDate = dbSub.endDate;

      if (subscriptionObj.current_end) {
        endDate = new Date(subscriptionObj.current_end * 1000);
      }

      switch (event) {
        case "subscription.activated":
          newStatus = "ACTIVE";
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_ACTIVATED",
              details: `Razorpay subscription ${rzpSubId} activated.`
            }
          });
          break;

        case "subscription.charged":
          newStatus = "ACTIVE";
          // Create Invoice record
          const paymentId = payloadData.payment?.entity?.id || null;
          const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          await prisma.invoice.create({
            data: {
              tenantId,
              subscriptionId: dbSub.id,
              invoiceNumber,
              amount: subscriptionObj.plan_id ? subscriptionObj.amount / 100 : 0,
              discountAmount: 0,
              netAmount: subscriptionObj.plan_id ? subscriptionObj.amount / 100 : 0,
              currency: subscriptionObj.currency || "INR",
              status: "PAID",
              paidAt: new Date(),
              razorpayPaymentId: paymentId,
              razorpayOrderId: subscriptionObj.order_id || null
            }
          });

          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_RENEWAL_PAID",
              details: `Payment of ₹${subscriptionObj.amount / 100} received for subscription ${rzpSubId}.`
            }
          });
          break;

        case "subscription.pending":
          newStatus = "PAST_DUE"; // Grace period begins
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_PAYMENT_FAILED",
              details: `Renewal payment failed for subscription ${rzpSubId}. Subscription is in grace period.`
            }
          });
          break;

        case "subscription.halted":
          newStatus = "UNPAID"; // Grace period expired, access blocked
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_HALTED",
              details: `Subscription ${rzpSubId} halted after multiple failure retries. Access suspended.`
            }
          });
          break;

        case "subscription.cancelled":
          newStatus = "CANCELLED";
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_CANCELLED",
              details: `Subscription ${rzpSubId} cancelled.`
            }
          });
          break;

        case "subscription.completed":
          newStatus = "EXPIRED";
          await prisma.auditLog.create({
            data: {
              tenantId,
              action: "SUBSCRIPTION_COMPLETED",
              details: `Subscription ${rzpSubId} completed.`
            }
          });
          break;
      }

      await prisma.tenantSubscription.update({
        where: { id: dbSub.id },
        data: {
          status: newStatus,
          endDate,
          canceledAt: event === "subscription.cancelled" ? new Date() : undefined
        }
      });

      // Update current subscription plan on Tenant model
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionPlan: dbSub.plan.name
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[RAZORPAY WEBHOOK] Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
