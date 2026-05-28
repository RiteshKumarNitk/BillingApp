import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Package, Barcode, Tag, Calendar, AlertTriangle, ArrowLeft, Pencil, DollarSign, Box } from 'lucide-react';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) notFound();

  const p = product as any;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const margin = p.purchasePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.purchasePrice * 100) : null;
  const isLowStock = p.stock <= p.minStockThreshold;
  const isCritical = p.stock <= 5;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Product Details</p>
          </div>
        </div>
        <Link
          href={`/products/${p.id}/edit`}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Pencil className="w-4 h-4" />
          Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Pricing
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
                <p className="text-xl font-bold text-gray-900">₹{p.purchasePrice.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">MRP</p>
                <p className="text-xl font-bold text-gray-900">₹{p.mrp.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Sale Price</p>
                <p className="text-xl font-bold text-green-600">₹{p.salePrice.toFixed(2)}</p>
              </div>
            </div>
            {margin !== null && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-gray-500">Margin:</span>
                <span className={`font-semibold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />
              Inventory
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${
                  isCritical ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {p.stock} {p.unit || 'pcs'}
                  {isCritical && <AlertTriangle className="w-5 h-5" />}
                </p>
                {isLowStock && (
                  <p className={`text-xs mt-1 font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                    {isCritical ? 'CRITICAL - Reorder immediately' : `Low stock (min: ${p.minStockThreshold})`}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Min Stock Threshold</p>
                <p className="text-2xl font-bold text-gray-900">{p.minStockThreshold}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Category</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {p.category ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {p.category}
                    </span>
                  ) : 'Uncategorized'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Barcode</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5 font-mono">
                  {p.barcode ? (
                    <span className="inline-flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-gray-400" />
                      {p.barcode}
                    </span>
                  ) : 'No barcode'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Batch Number</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{p.batchNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Unit</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{p.unit || 'PIECE'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Dates
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Manufacturing Date</dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(p.manufacturingDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Expiry Date</dt>
                <dd className={`text-sm font-medium mt-0.5 ${p.expiryDate && new Date(p.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(p.expiryDate)}
                  {p.expiryDate && new Date(p.expiryDate) < new Date() && <span className="ml-1 text-xs text-red-600">(Expired)</span>}
                </dd>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-600 mt-0.5">{formatDate(p.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-600 mt-0.5">{formatDate(p.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
