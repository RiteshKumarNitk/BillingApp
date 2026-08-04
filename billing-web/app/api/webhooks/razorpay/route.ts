import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isSimulationMode, verifyRazorpayWebhook } from "@/lib/razorpay";

// Builds the invoice-dedupe filter. Returns null when neither a payment id nor an order id exists
// (nothing to dedupe against) so callers never hit Prisma's "OR needs at least one argument"
// validation error with an empty array.
function buildInvoiceDedupeFilter(
  subscriptionId: string,
  paymentId: string | null,
  orderId: string | null
): { subscriptionId: string; OR: { razorpayPaymentId?: string; razorpayOrderId?: string }[] } | null {
  const conditions = [
    ...(paymentId ? [{ razorpayPaymentId: paymentId }] : []),
    ...(orderId ? [{ razorpayOrderId: orderId }] : []),
  ];
  return conditions.length > 0 ? { subscriptionId, OR: conditions } : null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // S3 guard: this endpoint is intentionally reachable without a session (the signature is the
    // auth), but simulation mode silently accepts ANY payload as valid. In a production deploy
    // with missing/dummy Razorpay keys that would let anyone forge payment events — refuse to
    // run the webhook at all instead.
    if (isSimulationMode && process.env.NODE_ENV === "production") {
      console.error(
        "[RAZORPAY WEBHOOK] Rejecting webhook: Razorpay keys are missing but NODE_ENV=production (simulation mode is not allowed in production)"
      );
      return NextResponse.json({ error: "Payment provider not configured" }, { status: 503 });
    }

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
          const orderId = subscriptionObj.order_id || null;
          const baseAmount = subscriptionObj.plan_id ? subscriptionObj.amount / 100 : 0;
          // M2: the coupon code rides along in the subscription's Razorpay notes (set at checkout
          // creation in lib/actions/subscription.ts) so we can attribute the redemption here.
          const couponCodeFromNotes = notes.couponCode || null;

          // Idempotency: Razorpay retries webhook delivery until it gets a 2xx, so the same
          // subscription.charged event can arrive multiple times. Dedupe on the payment id (and
          // fall back to order id) so retries can't mint duplicate PAID invoices. Note: there is
          // no unique DB constraint on razorpayPaymentId/razorpayOrderId (a migration is out of
          // scope while prisma migrate dev is broken — see REPORTS.md D2), so this guard is the
          // application-level backstop. The write happens in a $transaction with the check to
          // keep the window between check and insert as small as possible.
          const dedupeFilter = buildInvoiceDedupeFilter(dbSub.id, paymentId, orderId);
          const existingInvoice = dedupeFilter
            ? await prisma.invoice.findFirst({ where: dedupeFilter })
            : null;

          if (!existingInvoice) {
            const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await prisma.$transaction(async (tx) => {
              const stillAbsent = dedupeFilter
                ? await tx.invoice.findFirst({ where: dedupeFilter })
                : null;
              if (stillAbsent) return; // lost the race to a concurrent retry

              // M2: the redemption is counted HERE — at payment-confirmed time, not at checkout
              // creation (abandoned/retried checkouts no longer burn the cap). Guards:
              // (1) the invoice create above is deduped on payment/order id, so a webhook retry
              // can't double-count; (2) we redeem only once per subscription — if an earlier
              // charge for this subscription already used this coupon, renewals skip it;
              // (3) the coupon is re-validated now (active, unexpired, cap not reached) rather
              // than trusting the snapshot taken at checkout creation.
              let discountAmount = 0;
              let couponId: string | null = null;
              if (couponCodeFromNotes) {
                const coupon = await tx.coupon.findUnique({
                  where: { code: couponCodeFromNotes.toUpperCase() }
                });
                if (coupon && coupon.isActive && (!coupon.expiryDate || coupon.expiryDate > new Date())) {
                  const alreadyRedeemed = await tx.invoice.findFirst({
                    where: { subscriptionId: dbSub.id, couponId: coupon.id }
                  });
                  if (!alreadyRedeemed) {
                    // Atomic cap guard: the increment lands only when the cap still has room
                    // (count === 1), so concurrent redemptions can't overshoot maxRedemptions.
                    const redeemed = await tx.coupon.updateMany({
                      where: {
                        id: coupon.id,
                        ...(coupon.maxRedemptions ? { redemptions: { lt: coupon.maxRedemptions } } : {}),
                      },
                      data: { redemptions: { increment: 1 } },
                    });
                    if (redeemed.count === 1) {
                      discountAmount = coupon.discountType === "PERCENTAGE"
                        ? (baseAmount * coupon.discountValue) / 100
                        : coupon.discountValue;
                      couponId = coupon.id;
                    }
                  }
                }
              }

              await tx.invoice.create({
                data: {
                  tenantId,
                  subscriptionId: dbSub.id,
                  invoiceNumber,
                  amount: baseAmount,
                  discountAmount,
                  netAmount: Math.max(0, baseAmount - discountAmount),
                  currency: subscriptionObj.currency || "INR",
                  status: "PAID",
                  paidAt: new Date(),
                  razorpayPaymentId: paymentId,
                  razorpayOrderId: orderId,
                  couponId
                }
              });

              await tx.auditLog.create({
                data: {
                  tenantId,
                  action: "SUBSCRIPTION_RENEWAL_PAID",
                  details: `Payment of ₹${subscriptionObj.amount / 100} received for subscription ${rzpSubId}.`
                }
              });
            });
          } else {
            console.log(`[RAZORPAY WEBHOOK] Duplicate subscription.charged (payment ${paymentId || orderId}) — invoice already recorded, skipping`);
          }
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
