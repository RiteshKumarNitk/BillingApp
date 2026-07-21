"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import razorpayClient, { isSimulationMode } from "@/lib/razorpay";
import { revalidatePath } from "next/cache";
import { sendEmail, EmailTemplates } from "@/lib/mail";

// Ensure the caller is authenticated
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session;
}

// Ensure the caller is a Super Admin
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Superadmin access required");
  }
  return session;
}

// Create a subscription checkout session (Razorpay)
export async function createCheckoutSession(planId: string, couponCode?: string) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // 1. Fetch Plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });
  if (!plan) throw new Error("Plan not found");

  // 2. Validate Coupon if provided
  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() }
    });
    if (
      coupon &&
      coupon.isActive &&
      (!coupon.expiryDate || coupon.expiryDate > new Date()) &&
      (!coupon.maxRedemptions || coupon.redemptions < coupon.maxRedemptions)
    ) {
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (plan.amount * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }
    }
  }

  const finalAmount = Math.max(0, plan.amount - discountAmount);

  // 3. Check if there's trial days (Free Trial) and finalAmount is 0
  const isTrial = plan.trialDays > 0 && finalAmount === 0;

  let rzpSubscriptionId = null;
  let shortUrl = `/settings/billing/checkout?success=true`; // fallback mock checkout page

  if (finalAmount > 0) {
    // Call Razorpay API to create subscription
    try {
      let rzpPlanId = plan.razorpayPlanId;
      if (!rzpPlanId) {
        // Create plan on Razorpay
        const rzpPlan = await razorpayClient.plans.create({
          period: plan.interval === "YEARLY" ? "yearly" : "monthly",
          interval: 1,
          item: {
            name: plan.name,
            amount: Math.round(plan.amount * 100), // in paise
            currency: plan.currency,
            description: plan.description || ""
          }
        });
        rzpPlanId = rzpPlan.id;

        // Save the generated Plan ID back to DB
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { razorpayPlanId: rzpPlanId }
        });
      }

      // Create subscription on Razorpay
      const trialEndTimestamp = plan.trialDays > 0
        ? Math.floor((Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) / 1000)
        : undefined;

      const rzpSub = await razorpayClient.subscriptions.create({
        plan_id: rzpPlanId!,
        total_count: plan.interval === "YEARLY" ? 12 : 36,
        quantity: 1,
        customer_notify: 1,
        start_at: trialEndTimestamp,
        notes: {
          tenantId
        }
      });

      rzpSubscriptionId = rzpSub.id;
      shortUrl = rzpSub.short_url || shortUrl;
    } catch (error: any) {
      console.error("Razorpay subscription creation failed:", error);
      throw new Error(`Billing integration failed: ${error.message || error}`);
    }
  }

  // Create local TenantSubscription record as PENDING
  const trialStartDate = plan.trialDays > 0 ? new Date() : null;
  const trialEndDate = plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null;

  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId,
      planId,
      status: isTrial ? "TRIAL" : "UNPAID",
      razorpaySubscriptionId: rzpSubscriptionId,
      startDate: new Date(),
      endDate: trialEndDate || new Date(Date.now() + (plan.interval === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000),
      trialStartDate,
      trialEndDate
    }
  });

  // If Coupon was valid, record redemption
  if (coupon && finalAmount > 0) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { redemptions: { increment: 1 } }
    });
  }

  // If Free Trial is active, update the Tenant model directly
  if (isTrial) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlan: plan.name
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "TRIAL_STARTED",
        details: `Started free trial for ${plan.name} plan (${plan.trialDays} days).`
      }
    });
  }

  revalidatePath("/settings/billing");

  return {
    subscriptionId: subscription.id,
    checkoutUrl: shortUrl,
    razorpaySubscriptionId: rzpSubscriptionId,
    isTrial,
    isSimulation: isSimulationMode
  };
}

// Cancel a subscription (immediate vs end-of-cycle)
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const sub = await prisma.tenantSubscription.findUnique({
    where: { id: subscriptionId, tenantId }
  });

  if (!sub) throw new Error("Subscription not found");

  if (sub.razorpaySubscriptionId) {
    try {
      await razorpayClient.subscriptions.cancel(sub.razorpaySubscriptionId, cancelAtPeriodEnd);
    } catch (e: any) {
      console.error("Razorpay subscription cancellation failed:", e);
      throw new Error(`Failed to cancel in billing gateway: ${e.message || e}`);
    }
  }

  if (cancelAtPeriodEnd) {
    await prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "SUBSCRIPTION_CANCEL_SCHEDULED",
        details: `Cancelled subscription scheduled at the end of the billing cycle.`
      }
    });
  } else {
    // Immediate cancellation
    await prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
        endedAt: new Date()
      }
    });

    // Reset tenant plan back to the entry tier
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlan: "Starter"
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "SUBSCRIPTION_CANCELLED_IMMEDIATE",
        details: `Subscription cancelled immediately.`
      }
    });
  }

  revalidatePath("/settings/billing");
  return true;
}

// Apply a Coupon Code to check validity and discount value
export async function applyCoupon(code: string, planId: string) {
  await requireAuth();

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });
  if (!plan) throw new Error("Plan not found");

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() }
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid or inactive coupon code");
  }

  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new Error("Coupon has expired");
  }

  if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
    throw new Error("Coupon redemption limit reached");
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (plan.amount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  const finalAmount = Math.max(0, plan.amount - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalAmount,
    couponId: coupon.id,
    code: coupon.code
  };
}

export async function validateCouponByPlanName(code: string, planName: string) {
  await requireSuperAdmin();

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { name: planName }
  });
  if (!plan) throw new Error("Plan not found");

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() }
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid or inactive coupon code");
  }

  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new Error("Coupon has expired");
  }

  if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
    throw new Error("Coupon redemption limit reached");
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (plan.amount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  const finalAmount = Math.max(0, plan.amount - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalAmount,
    originalAmount: plan.amount,
    code: coupon.code
  };
}

export async function markInvoiceAsPaid(invoiceId: string, paymentMethod: string = 'Manual Transfer') {
  await requireSuperAdmin();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { 
      subscription: true,
      tenant: true
    }
  });

  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === 'PAID') throw new Error("Invoice is already paid");

  await prisma.$transaction(async (tx) => {
    // 1. Mark invoice as paid
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        // We can optionally store payment method if there was a field, but for now we just mark status
      }
    });

    // 2. If it is linked to an UNPAID or PAST_DUE subscription, mark it ACTIVE
    if (invoice.subscriptionId && ['UNPAID', 'PAST_DUE', 'PENDING'].includes(invoice.subscription?.status || '')) {
      await tx.tenantSubscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: 'ACTIVE' }
      });
    }
  });

  // Send Email Notification
  if (invoice.tenant.email) {
    await sendEmail({
      to: invoice.tenant.email,
      subject: `Payment Received - Invoice #${invoice.invoiceNumber}`,
      html: EmailTemplates.InvoicePaid(invoice.tenant.name, invoice.invoiceNumber, invoice.netAmount)
    });
  }

  revalidatePath('/tenants');
  return true;
}

// Super Admin actions for managing plans
export async function createSubscriptionPlan(data: any) {
  await requireSuperAdmin();

  if (!data.name || data.amount === undefined || !data.interval) {
    throw new Error("Missing required fields (name, amount, interval)");
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      description: data.description || null,
      amount: parseFloat(data.amount),
      interval: data.interval, // "MONTHLY" or "YEARLY"
      trialDays: parseInt(data.trialDays) || 0,
      maxProducts: parseInt(data.maxProducts) || -1,
      maxUsers: parseInt(data.maxUsers) || -1,
      maxTransactions: parseInt(data.maxTransactions) || -1,
      isActive: data.isActive !== false
    }
  });

  revalidatePath("/admin/plans");
  return plan;
}

export async function updateSubscriptionPlan(id: string, data: any) {
  await requireSuperAdmin();

  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      amount: parseFloat(data.amount),
      interval: data.interval,
      trialDays: parseInt(data.trialDays) || 0,
      maxProducts: parseInt(data.maxProducts) || -1,
      maxUsers: parseInt(data.maxUsers) || -1,
      maxTransactions: parseInt(data.maxTransactions) || -1,
      isActive: data.isActive !== false
    }
  });

  revalidatePath("/admin/plans");
  return plan;
}

export async function deleteSubscriptionPlan(id: string) {
  await requireSuperAdmin();
  
  // Verify if it's safe to delete (e.g. no active subscriptions)
  const activeSubs = await prisma.tenantSubscription.count({
    where: { planId: id, status: { in: ["ACTIVE", "TRIAL"] } }
  });

  if (activeSubs > 0) {
    throw new Error("Cannot delete plan. There are active subscriptions using this plan.");
  }

  await prisma.subscriptionPlan.delete({
    where: { id }
  });

  revalidatePath("/admin/plans");
  return true;
}

// Super Admin actions for managing coupons
export async function createCoupon(data: any) {
  await requireSuperAdmin();

  if (!data.code || !data.discountType || data.discountValue === undefined) {
    throw new Error("Missing required fields (code, discountType, discountValue)");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.trim().toUpperCase(),
      discountType: data.discountType, // "PERCENTAGE" or "FIXED"
      discountValue: parseFloat(data.discountValue),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      maxRedemptions: data.maxRedemptions ? parseInt(data.maxRedemptions) : null,
      isActive: data.isActive !== false
    }
  });

  revalidatePath("/admin/coupons");
  return coupon;
}

export async function toggleCouponStatus(id: string) {
  await requireSuperAdmin();

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error("Coupon not found");

  const updated = await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive }
  });

  revalidatePath("/admin/coupons");
  return updated;
}
