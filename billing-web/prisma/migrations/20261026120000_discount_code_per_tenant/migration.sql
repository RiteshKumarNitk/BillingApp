-- D6: Discount.code was globally unique across all tenants; make it unique per tenant instead.
-- Existing data can't violate the new constraint (it was already globally unique).

-- DropIndex
DROP INDEX "Discount_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Discount_tenantId_code_key" ON "Discount"("tenantId", "code");
