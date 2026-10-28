-- Guest checkout idempotency: (customerAccountId, idempotencyKey) never deduplicated guest orders
-- because customerAccountId is NULL for guests. Keys are random UUIDs, so tenant scope is enough.
-- Existing keyed rows came from logged-in checkouts that were already unique per customer; a
-- cross-customer collision of random UUIDs within one tenant is not a realistic concern.

-- CreateIndex
CREATE UNIQUE INDEX "OrderRequest_tenantId_idempotencyKey_key" ON "OrderRequest"("tenantId", "idempotencyKey");
