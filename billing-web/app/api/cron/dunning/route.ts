import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, EmailTemplates } from '@/lib/mail';

// This endpoint should ideally be protected by a cron secret in production
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');

    // In a real app, verify cronSecret === process.env.CRON_SECRET
    // For now, we'll allow it or use a dummy check
    if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();

    // 1. Find all PENDING / PAST_DUE invoices that are due for a retry
    // Assuming nextRetryDate is null for first failure, or explicitly set
    const failedInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        OR: [
          { nextRetryDate: { lte: today } },
          { nextRetryDate: null }
        ],
        // Safety: don't retry invoices older than 30 days automatically without manual intervention
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      include: {
        tenant: true,
        subscription: true
      }
    });

    let processedCount = 0;
    let suspendedCount = 0;

    for (const invoice of failedInvoices) {
      const attempts = invoice.failedPaymentAttempts + 1;

      if (attempts >= 3) {
        // Suspend the tenant's subscription
        if (invoice.subscriptionId) {
          await prisma.tenantSubscription.update({
            where: { id: invoice.subscriptionId },
            data: { status: 'SUSPENDED' }
          });
          
          await prisma.auditLog.create({
            data: {
              tenantId: invoice.tenantId,
              action: "SUBSCRIPTION_SUSPENDED",
              details: `Subscription suspended due to 3 failed payment attempts on Invoice #${invoice.invoiceNumber}.`
            }
          });
        }
        
        // Mark invoice as fully FAILED, no more retries
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { 
            status: 'FAILED',
            failedPaymentAttempts: attempts,
            nextRetryDate: null
          }
        });

        suspendedCount++;

      } else {
        // Increment attempts, set next retry date to 3 days from now
        const nextRetry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            failedPaymentAttempts: attempts,
            nextRetryDate: nextRetry,
            status: 'FAILED' // Mark as failed temporarily while we retry
          }
        });

        if (invoice.subscriptionId) {
          await prisma.tenantSubscription.update({
            where: { id: invoice.subscriptionId },
            data: { status: 'PAST_DUE' }
          });
        }

        // Send Dunning Email
        if (invoice.tenant.email) {
          await sendEmail({
            to: invoice.tenant.email,
            subject: `Action Required: Payment Failed (Attempt ${attempts}/3)`,
            html: EmailTemplates.PaymentFailed(invoice.tenant.name, invoice.invoiceNumber, attempts)
          });
        }

        processedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      suspended: suspendedCount,
      message: 'Dunning cycle completed successfully.'
    });

  } catch (error: any) {
    console.error("Dunning cron error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
