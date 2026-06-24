import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import PrintButton from './PrintButton';

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return <div>Unauthorized</div>;
  }

  const { id: invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: true,
      subscription: {
        include: { plan: true }
      },
      coupon: true
    }
  });

  if (!invoice) {
    notFound();
  }

  const brandColor = invoice.tenant.primaryColor || '#4F46E5';
  const brandFont = invoice.tenant.fontFamily || 'sans-serif';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <div 
        className="min-h-screen bg-slate-100 py-12 px-4 flex justify-center print:bg-white print:py-0 print:px-0"
        style={{ fontFamily: brandFont }}
      >
        <div className="bg-white max-w-[210mm] w-full shadow-xl print:shadow-none relative">
          
          {/* Paid Watermark */}
          {invoice.status === 'PAID' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.04] pointer-events-none print:opacity-[0.06] z-0">
              <span className="text-[10rem] font-black uppercase tracking-tighter text-emerald-600">PAID</span>
            </div>
          )}

          {/* Action Bar (Screen Only) */}
          <div className="flex justify-between items-center bg-indigo-50 px-8 py-4 border-b border-indigo-100 print:hidden relative z-10">
            <div className="text-indigo-900 font-semibold text-sm">
              Invoice #{invoice.invoiceNumber}
            </div>
            <PrintButton />
          </div>

          <div className="p-12 sm:p-16 relative z-10">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span className="text-white font-bold text-2xl">
                      {invoice.tenant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{invoice.tenant.name}</h2>
                    <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase mt-1">Software Solutions</p>
                  </div>
                </div>
                <div className="text-sm text-slate-500 leading-relaxed mt-4">
                  <p>123 Tech Park, Cyber City</p>
                  <p>support@billingapp.example.com</p>
                  <p>+91 (800) 123-4567</p>
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-5xl font-black text-slate-200 tracking-tight uppercase mb-6">Invoice</h1>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Invoice No:</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  
                  <span className="text-slate-500 font-medium">Issue Date:</span>
                  <span className="font-bold text-slate-900">{new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  
                  <span className="text-slate-500 font-medium pt-1">Status:</span>
                  <div className="pt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Info Section */}
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</h3>
                <div className="bg-white rounded-xl p-5 border border-slate-200 h-full shadow-sm">
                  <p className="text-lg font-bold text-slate-900 mb-1">{invoice.tenant.name}</p>
                  {invoice.tenant.contactPerson && <p className="text-sm text-slate-700 font-medium mb-3">{invoice.tenant.contactPerson}</p>}
                  
                  <div className="space-y-1 text-sm text-slate-500">
                    {invoice.tenant.email && <p className="flex items-center gap-2"><span>✉</span> {invoice.tenant.email}</p>}
                    {invoice.tenant.phone && <p className="flex items-center gap-2"><span>☎</span> {invoice.tenant.phone}</p>}
                    {invoice.tenant.address && <p className="flex items-start gap-2 mt-2"><span>⌂</span> <span className="leading-relaxed">{invoice.tenant.address}</span></p>}
                  </div>
                </div>
              </div>
              
              {invoice.tenant.gstin && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tax Information</h3>
                  <div className="bg-white rounded-xl p-5 border border-slate-200 h-full shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">GSTIN / Tax ID</p>
                    <p className="text-lg font-mono font-bold text-slate-900 mt-1">{invoice.tenant.gstin}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Items Table */}
            <div className="mb-12 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="py-5 px-6">
                      <p className="font-bold text-slate-900 text-base">{invoice.subscription?.plan.name || 'Subscription Plan'} <span className="text-sm font-medium text-slate-400 ml-1">({invoice.subscription?.plan.interval || 'N/A'})</span></p>
                      <p className="text-sm text-slate-500 mt-1">SaaS platform access and resource utilization.</p>
                    </td>
                    <td className="py-5 px-6 text-right font-bold text-slate-900 text-lg">₹{invoice.amount.toFixed(2)}</td>
                  </tr>
                  {invoice.discountAmount > 0 && (
                    <tr className="bg-emerald-50/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">%</span>
                          <p className="font-bold text-emerald-700">Discount Applied</p>
                        </div>
                        {invoice.coupon?.code && (
                          <p className="text-sm text-emerald-600 mt-1 font-medium">Coupon Code: <span className="uppercase font-bold tracking-wider">{invoice.coupon.code}</span></p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-600 text-lg">-₹{invoice.discountAmount.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-between items-end gap-8 mb-16">
              <div className="w-1/2 text-sm text-slate-500 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-700 mb-2">Payment Instructions:</p>
                <p className="mb-1">Please make all cheques payable to <span className="font-semibold text-slate-900">BillingApp Inc</span>.</p>
                <p>For bank transfers: Account #123456789, IFSC: SBIN0001234</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-emerald-600 font-medium">Discount Applied</span>
                    <span className="font-semibold text-emerald-600">-₹{invoice.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-black" style={{ color: brandColor }}>
                    ₹{invoice.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t-2 border-slate-100 text-center">
              <p className="text-base font-bold text-slate-900">Thank you for your business!</p>
              <p className="text-sm text-slate-400 mt-2 font-medium">This is a computer-generated document. No signature is required.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
