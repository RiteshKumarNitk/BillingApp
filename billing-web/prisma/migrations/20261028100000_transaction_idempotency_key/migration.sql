-- POS checkout idempotency: at most one sale per (tenant, client-generated key), so a double-click,
-- network retry or second tab can't create a duplicate sale. Existing rows get NULL, which
-- Postgres treats as distinct, so the unique index applies only to new keyed sales.

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tenantId_idempotencyKey_key" ON "Transaction"("tenantId", "idempotencyKey");
