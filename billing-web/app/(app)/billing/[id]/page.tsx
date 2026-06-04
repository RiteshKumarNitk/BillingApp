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
      user: {
        select: {
          name: true,
          email: true
        }
      },
      tenant: {
        select: {
          name: true
        }
      }
    }
  });

  if (!transaction) {
    notFound();
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate totals from items (should match transaction totals, but we recalculate for safety)
  const subtotal = transaction.items.reduce((sum: number, item: any) => sum + item.itemTotal, 0);
  const discountAmount = (subtotal * transaction.discount) / 100;
  const netAmount = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-white p-6 print:p-0 print:min-h-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; background: white; }
          /* Hide all sidebars and topnavs */
          aside, nav, header { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          
          /* Show only the receipt */
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            font-family: monospace;
            font-size: 12px;
          }
          .print\\:hidden { display: none !important; }
        }
      `}} />

      <div id="printable-receipt" className="max-w-md mx-auto bg-white">
        {/* Header */ }
        <div className="mb-6 text-center border-b border-dashed border-gray-400 pb-4">
          <h1 className="text-xl font-bold text-black uppercase tracking-wider mb-1">
            {transaction.tenant.name}
          </h1>
          <p className="text-xs text-black">TAX INVOICE</p>
        </div>

        {/* Bill Details */ }
        <div className="mb-4 text-xs text-black space-y-1">
          <div className="flex justify-between">
            <span>Bill #:</span>
            <span className="font-medium">{transaction.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{transaction.user.name}</span>
          </div>
        </div>

        {/* Items Table */ }
        <div className="mb-4 border-t border-b border-dashed border-gray-400 py-2 text-xs">
          <table className="w-full text-black">
            <thead>
              <tr className="border-b border-dashed border-gray-400">
                <th className="text-left py-1 font-medium w-1/2">Item</th>
                <th className="text-center py-1 font-medium w-1/6">Qty</th>
                <th className="text-right py-1 font-medium w-1/3">Total</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 pr-1">
                    <div className="font-medium truncate max-w-[120px]">{item.name}</div>
                    <div className="text-[10px] text-gray-600">@ ₹{item.salePrice.toFixed(2)}</div>
                  </td>
                  <td className="py-2 text-center align-top">{item.quantity}</td>
                  <td className="py-2 text-right align-top font-medium">₹{item.itemTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */ }
        <div className="space-y-1 text-xs text-black mb-6">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Discount ({transaction.discount}%):</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-dashed border-gray-400 mt-2">
            <span>TOTAL:</span>
            <span>₹{netAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */ }
        <div className="text-center text-[10px] text-black border-t border-dashed border-gray-400 pt-4 pb-8">
          <p className="font-bold mb-1">THANK YOU FOR YOUR BUSINESS!</p>
          <p>This is a computer generated invoice.</p>
        </div>
      </div>

      {/* Print Button Wrapper */ }
      <PrintInvoiceButton />
    </div>
  );
}