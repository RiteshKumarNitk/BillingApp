import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/website/utils';
import { isValidUuid } from '@/lib/website/slug';
import OrderAutoRefresh from './OrderAutoRefresh';

export const dynamic = 'force-dynamic';

// Personal order status pages must never be indexed or cached by search engines.
export const metadata: Metadata = { title: 'Order status', robots: { index: false, follow: false } };

const STEPS = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'] as const;
const STEP_LABEL: Record<string, string> = {
  PENDING: 'Order received', ON_HOLD: 'On hold — the cafe will confirm shortly', ACCEPTED: 'Accepted',
  PREPARING: 'Being prepared', READY: 'Ready for pickup', COMPLETED: 'Completed',
  REJECTED: 'Declined by the cafe', CANCELLED: 'Cancelled',
};
const FINAL = new Set(['COMPLETED', 'REJECTED', 'CANCELLED']);

// Public order tracking for guests (and anyone holding the link), at /track/[cafe]/[orderId].
// Deliberately outside /site/[tenantId]: that segment has a loading.tsx, so its pages stream and an
// unknown order would render the 404 page with HTTP 200 (measured). Here notFound() is a real 404.
// The order id is a random UUID,
// so the link itself is the credential — like any "anyone with the link" share. Only what the
// customer already saw at checkout is shown: items, totals, status, and the first name only.
export default async function OrderStatusPage({ params }: { params: Promise<{ tenantId: string; orderId: string }> }) {
  const { tenantId, orderId } = await params;
  if (!isValidUuid(orderId)) notFound();

  const tenant = await resolveTenant(tenantId);
  if (!tenant) notFound();

  // Always a live read (never the public cache): status changes are the whole point of the page.
  const order = await prisma.orderRequest.findFirst({
    where: { id: orderId, tenantId: tenant.id },
    select: {
      id: true, status: true, createdAt: true, updatedAt: true, orderType: true, guestName: true,
      totalAmount: true, discountAmount: true, discountLabel: true, taxAmount: true, netAmount: true,
      table: { select: { label: true } },
      customerAccount: { select: { name: true } },
      items: { select: { name: true, quantity: true, itemTotal: true } },
    },
  });
  if (!order) notFound();

  const firstName = (order.customerAccount?.name || order.guestName || '').trim().split(/\s+/)[0];
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const isFinal = FINAL.has(order.status);
  const failed = order.status === 'REJECTED' || order.status === 'CANCELLED';
  const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const siteId = tenant.websiteSlug || tenant.id;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-gray-50 px-4 py-10 sm:bg-transparent">
      {!isFinal && <OrderAutoRefresh intervalMs={15000} />}
      <p className="text-sm text-gray-500">{tenant.name}</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">
        {firstName ? `${firstName}, your order` : 'Your order'} <span className="font-mono text-base text-gray-400">#{order.id.slice(0, 8)}</span>
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {order.orderType === 'DINE_IN' ? `Dine-in${order.table ? ` · ${order.table.label}` : ''}` : 'Takeaway'} · placed {order.createdAt.toLocaleString('en-IN', { timeZone: tenant.timezone || 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}
      </p>

      <section className={`mt-6 rounded-2xl border p-5 ${failed ? 'border-rose-100 bg-rose-50' : 'border-gray-100 bg-white shadow-sm'}`}>
        <p className={`text-lg font-semibold ${failed ? 'text-rose-700' : 'text-gray-900'}`}>{STEP_LABEL[order.status] || order.status}</p>
        {!failed && (
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => {
              const done = stepIndex >= i;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{done ? '✓' : i + 1}</span>
                  <span className={done ? 'font-medium text-gray-900' : 'text-gray-400'}>{STEP_LABEL[step]}</span>
                </li>
              );
            })}
          </ol>
        )}
        {!isFinal && <p className="mt-4 text-xs text-gray-400">This page updates automatically.</p>}
        {order.status === 'READY' && <p className="mt-3 text-sm font-medium text-emerald-700">Please collect your order at the counter and pay there.</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <ul className="divide-y divide-gray-100 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between py-2">
              <span className="text-gray-700">{item.quantity}× {item.name}</span>
              <span className="text-gray-900">{inr(item.itemTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          {order.discountAmount > 0 && <div className="flex justify-between text-emerald-700"><span>{order.discountLabel || 'Discount'}</span><span>−{inr(order.discountAmount)}</span></div>}
          {order.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>{inr(order.taxAmount)}</span></div>}
          <div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span>{inr(order.netAmount)}</span></div>
        </div>
      </section>

      <p className="mt-6 text-center text-sm">
        <Link href={`/site/${siteId}`} className="font-medium text-gray-600 hover:text-gray-900">← Back to {tenant.name}</Link>
      </p>
    </main>
  );
}
