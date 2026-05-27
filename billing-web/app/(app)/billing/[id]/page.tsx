import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PrintInvoiceButton from './PrintInvoiceButton';

export const dynamic = 'force-static'; // This is a demo page, in real app you might want to fetch on request

export default async function BillPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: transactionId } = await params;

  // Fetch the transaction with related data
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
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
  const subtotal = transaction.items.reduce((sum, item) => sum + item.itemTotal, 0);
  const discountAmount = (subtotal * transaction.discount) / 100;
  const netAmount = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */ }
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            INVOICE
          </h1>
          <p className="text-center text-gray-600">
            {transaction.tenant.name}
          </p>
        </div>

        {/* Bill Details */ }
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Bill #: {transaction.id.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500">
              Date: {formatDate(transaction.createdAt)}
            </p>
            <p className="text-sm text-gray-500">
              Cashier: {transaction.user.name}
            </p>
          </div>

          <div className="space-y-4 text-right">
            <p className="text-sm text-gray-500">
              Billed To: Walk-in Customer
            </p>
            <p className="text-sm text-gray-500">
              POS Terminal: #001
            </p>
          </div>
        </div>

        {/* Items Table */ }
        <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transaction.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                    <br />
                    <span className="text-xs text-gray-500">
                      Barcode: {item.barcode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ${item.salePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    ${item.itemTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */ }
        <div className="mt-8 space-y-6">
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Discount ({transaction.discount}%):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-2xl font-bold text-gray-900">
              <span>Total Due:</span>
              <span>${netAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */ }
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>
            Thank you for your business!
          </p>
          <p>
            This is a computer generated invoice.
          </p>
        </div>

        {/* Print Button */ }
        <PrintInvoiceButton />
      </div>
    </div>
  );
}