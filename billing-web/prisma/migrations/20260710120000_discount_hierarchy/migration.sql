-- AlterTable
ALTER TABLE "Discount" ADD COLUMN "code" TEXT;

-- AlterTable
ALTER TABLE "TransactionItem" ADD COLUMN "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");
