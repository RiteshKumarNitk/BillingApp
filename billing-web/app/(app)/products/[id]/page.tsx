import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    notFound();
  }

  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Product Details</h1>
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-500">
            ← Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              {product.barcode && (
                <p className="text-sm text-gray-500 mt-1">
                  Barcode: {product.barcode}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Pricing</h3>
                <p className="text-sm">
                  <span className="font-semibold">Purchase Price:</span> ₹{product.purchasePrice?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">MRP:</span> ₹{product.mrp.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Sale Price:</span> ₹{product.salePrice.toFixed(2)}
                </p>
                <p className="text-sm mt-2">
                  <span className="font-semibold">Margin:</span> 
                  {((product.salePrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)}%
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Inventory</h3>
                <p className="text-sm">
                  <span className="font-semibold">Stock:</span> {product.stock ?? 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Min Stock Threshold:</span> {product.minStockThreshold}
                </p>
                {product.stock !== null && product.stock <= product.minStockThreshold && (
                  <p className="text-sm text-red-600 font-bold mt-1">
                    ⚠️ Low Stock Alert!
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Dates</h3>
                <p className="text-sm">
                  <span className="font-semibold">Manufacturing Date:</span> {formatDate(product.manufacturingDate)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Expiry Date:</span> {formatDate(product.expiryDate)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Batch Number:</span> {product.batchNumber || 'N/A'}
                </p>
              </div>
            </div>

            {product.category && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Category</h3>
                <p className="text-sm">{product.category}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Timestamps</h3>
              <p className="text-sm">
                <span className="font-semibold">Created:</span> {formatDate(product.createdAt)}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Updated:</span> {formatDate(product.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Link
              href={`/products/${product.id}/edit`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Edit Product
            </Link>
            <Link
              href="/products"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}