import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import PrintInvoiceButton from './PrintInvoiceButton';

export default async function BillPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: transactionId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect('/auth/login');
  }

  // Fetch the transaction with related data, scoped to tenant
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, tenantId: session.user.tenantId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      payments: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      tenant: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          gstin: true,
          logoUrl: true
        }
      }
    }
  });

  if (!transaction) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // netAmount is the stored, authoritative total (computed server-side by
  // lib/services/transactions.ts, which applies the full item -> coupon ->
  // bill% -> loyalty discount hierarchy). Everything below is derived only
  // for display purposes, not recomputed as the source of truth.
  const subtotal = transaction.totalAmount;
  const netAmount = transaction.netAmount;
  const itemDiscountTotal = transaction.items.reduce((sum: number, item: any) => sum + (item.discountAmount || 0), 0);
  const afterItemDiscounts = subtotal - itemDiscountTotal;
  const billDiscountAmount = Math.max(
    0,
    afterItemDiscounts - transaction.couponDiscountAmount - transaction.loyaltyDiscountAmount - netAmount + transaction.taxAmount
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 print:p-0 print:min-h-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; background: white; }
          aside, nav, header { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            background: white;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />

      <div className="max-w-md mx-auto space-y-4">
        {/* Screen View */}
        <div id="printable-receipt" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            {transaction.tenant.logoUrl && (
              <img src={transaction.tenant.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2" />
            )}
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {transaction.tenant.name}
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest font-medium">Tax Invoice</p>
            {transaction.tenant.address && (
              <p className="text-[10px] text-gray-500 mt-1 max-w-[250px] mx-auto">{transaction.tenant.address}</p>
            )}
            {transaction.tenant.phone && (
              <p className="text-[10px] text-gray-500">Tel: {transaction.tenant.phone}</p>
            )}
            {transaction.tenant.gstin && (
              <p className="text-[10px] text-gray-500 font-medium">GSTIN: {transaction.tenant.gstin}</p>
            )}
          </div>

          {/* Bill Info */}
          <div className="text-xs text-gray-600 space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-semibold text-gray-900 font-mono">#{transaction.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="text-gray-900">{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="text-gray-900">{formatTime(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="text-gray-900">{transaction.user.name}</span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between pt-1 border-t border-dashed border-gray-200">
                <span>Customer:</span>
                <span className="text-gray-900 font-medium">{transaction.customerName}</span>
              </div>
            )}
            {transaction.customerPhone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="text-gray-900">{transaction.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border-y-2 border-dashed border-gray-300 py-3 mb-4">
            <div className="flex text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-dashed border-gray-200">
              <div className="flex-1">Item</div>
              <div className="w-12 text-center">Qty</div>
              <div className="w-20 text-right">Amount</div>
            </div>
            <div className="space-y-2">
              {transaction.items.map((item: any) => (
                <div key={item.id} className="flex text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-400">@ ₹{item.salePrice.toFixed(2)}</div>
                  </div>
                  <div className="w-12 text-center text-gray-900 tabular-nums self-center">{item.quantity}</div>
                  <div className="w-20 text-right font-medium text-gray-900 tabular-nums self-center">₹{item.itemTotal.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="text-xs space-y-1.5 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
            {itemDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Item Discounts</span>
                <span className="tabular-nums">-₹{itemDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            {transaction.couponDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon {transaction.couponCode ? `(${transaction.couponCode})` : ''}</span>
                <span className="tabular-nums">-₹{transaction.couponDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {billDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({transaction.discount}%)</span>
                <span className="tabular-nums">-₹{billDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {transaction.loyaltyDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Loyalty Points ({transaction.loyaltyPointsRedeemed})</span>
                <span className="tabular-nums">-₹{transaction.loyaltyDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {transaction.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="tabular-nums">₹{transaction.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {transaction.payments.length > 1 ? (
              <div className="pt-1">
                <div className="text-gray-500 mb-1">Payment (Split)</div>
                {transaction.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-gray-500 pl-2">
                    <span>{p.method}</span>
                    <span className="tabular-nums">₹{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : transaction.paymentMethod && (
              <div className="flex justify-between text-gray-500">
                <span>Payment</span>
                <span className="font-medium">{transaction.paymentMethod}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-dashed border-gray-300 mt-2">
              <span>TOTAL</span>
              <span className="tabular-nums">₹{netAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-dashed border-gray-300 pt-4">
            <p className="text-xs font-bold text-gray-800 tracking-wide">THANK YOU FOR YOUR BUSINESS!</p>
            <p className="text-[10px] text-gray-400 mt-0.5">This is a computer-generated invoice</p>
            {transaction.loyaltyPointsEarned > 0 && (
              <p className="text-[10px] text-amber-600 font-medium mt-1.5">
                You earned {transaction.loyaltyPointsEarned} loyalty points on this purchase
              </p>
            )}
            {transaction.amountReceived && (
              <div className="mt-3 text-[10px] text-gray-500 space-y-0.5">
                <div className="flex justify-between max-w-[200px] mx-auto">
                  <span>Amount Received:</span>
                  <span className="text-gray-900 font-medium">₹{transaction.amountReceived.toFixed(2)}</span>
                </div>
                {transaction.changeAmount && transaction.changeAmount > 0 && (
                  <div className="flex justify-between max-w-[200px] mx-auto">
                    <span>Change Returned:</span>
                    <span className="text-gray-900 font-medium">₹{transaction.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Print Button */}
        <PrintInvoiceButton />
      </div>
    </div>
  );
}
