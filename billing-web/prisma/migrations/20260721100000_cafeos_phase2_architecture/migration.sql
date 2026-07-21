-- CafeOS Phase 2: Cafe Architecture foundation.
-- Per-item GST + food options on Product, a Table model for QR ordering, and OrderRequest
-- extensions (table/orderType/guest checkout/expanded status) needed by later CafeOS phases.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "gstRate" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "gstInclusive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "foodType" TEXT;
ALTER TABLE "Product" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Table_qrToken_key" ON "Table"("qrToken");

-- CreateIndex
CREATE INDEX "Table_tenantId_idx" ON "Table"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_tenantId_label_key" ON "Table"("tenantId", "label");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: OrderRequest gains table/orderType/guest-checkout fields; customerAccountId becomes
-- nullable to support guest checkout (existing rows already all have a non-null value, so no
-- backfill needed for the relaxed constraint).
ALTER TABLE "OrderRequest" ALTER COLUMN "customerAccountId" DROP NOT NULL;
ALTER TABLE "OrderRequest" ADD COLUMN "tableId" TEXT;
ALTER TABLE "OrderRequest" ADD COLUMN "orderType" TEXT;
ALTER TABLE "OrderRequest" ADD COLUMN "guestName" TEXT;
ALTER TABLE "OrderRequest" ADD COLUMN "guestPhone" TEXT;

-- CreateIndex
CREATE INDEX "OrderRequest_tableId_idx" ON "OrderRequest"("tableId");

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
