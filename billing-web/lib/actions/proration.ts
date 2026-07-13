"use server";

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { revalidatePath } from 'next/cache';

function calculateDaysDifference(startDate: Date, endDate: Date) {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function calculateProration(tenantId: string, newPlanId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const currentSubscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId }
  });

  if (!newPlan) throw new Error("Target plan not found");

  if (!currentSubscription) {
    // No active subscription, full price
    return {
      proratedAmount: newPlan.amount,
      unusedValue: 0,
      newPlanAmount: newPlan.amount,
      daysRemaining: 0,
      isUpgrade: true
    };
  }

  const today = new Date();
  
  if (today >= currentSubscription.endDate) {
    return {
      proratedAmount: newPlan.amount,
      unusedValue: 0,
      newPlanAmount: newPlan.amount,
      daysRemaining: 0,
      isUpgrade: newPlan.amount > currentSubscription.plan.amount
    };
  }

  // Calculate total days in current cycle
  const totalDays = calculateDaysDifference(currentSubscription.startDate, currentSubscription.endDate);
  
  // Calculate remaining days
  const remainingDays = calculateDaysDifference(today, currentSubscription.endDate);

  // Calculate value per day of current plan
  const valuePerDay = currentSubscription.plan.amount / totalDays;
  
  // Unused value of current plan
  const unusedValue = valuePerDay * remainingDays;

  // New plan value for remaining days (if we want to just charge for the rest of the cycle)
  // Or just start a new cycle and apply credit. Let's start a new cycle and apply credit.
  const newPlanAmount = newPlan.amount;
  
  const proratedAmount = Math.max(0, newPlanAmount - unusedValue);

  return {
    proratedAmount: Number(proratedAmount.toFixed(2)),
    unusedValue: Number(unusedValue.toFixed(2)),
    newPlanAmount: Number(newPlanAmount.toFixed(2)),
    daysRemaining: remainingDays,
    isUpgrade: newPlan.amount > currentSubscription.plan.amount
  };
}

export async function changeSubscriptionPlan(tenantId: string, newPlanId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const proration = await calculateProration(tenantId, newPlanId);
  
  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId }
  });

  if (!newPlan) throw new Error("Target plan not found");

  await prisma.$transaction(async (tx) => {
    // End current active subscriptions
    await tx.tenantSubscription.updateMany({
      where: { tenantId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', endedAt: new Date() }
    });

    // Determine end date
    const startDate = new Date();
    const endDate = new Date();
    if (newPlan.interval === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create new subscription
    const newSubscription = await tx.tenantSubscription.create({
      data: {
        tenantId,
        planId: newPlan.id,
        status: proration.proratedAmount > 0 ? 'PENDING' : 'ACTIVE', // If free, activate immediately
        startDate,
        endDate
      }
    });

    // Update Tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: { subscriptionPlan: newPlan.name }
    });

    // Generate Invoice for the difference
    if (proration.proratedAmount >= 0) {
      await tx.invoice.create({
        data: {
          tenantId,
          subscriptionId: newSubscription.id,
          invoiceNumber: `INV-${Math.floor(Math.random() * 1000000)}-${Date.now().toString().slice(-3)}`,
          amount: newPlan.amount,
          discountAmount: proration.unusedValue,
          netAmount: proration.proratedAmount,
          status: proration.proratedAmount > 0 ? 'PENDING' : 'PAID', // Auto-paid if 0
        }
      });
    }
  });

  revalidatePath('/settings/billing');
  return true;
}
