-- Indexes chosen from EXPLAIN ANALYZE on the load-test dataset (see REPORTS.md 2026-10-28).
--
-- LARGE PRODUCTION TABLES: plain CREATE INDEX blocks writes to the table while it builds, and
-- Prisma runs this file inside a transaction (so CONCURRENTLY can't be used here). Every
-- statement is IF NOT EXISTS, so on a big database you can first run the same statements by hand
-- with CREATE INDEX CONCURRENTLY (no write lock), then deploy — these become no-ops.
-- See docs/PRODUCTION_RUNBOOK.md → "Index migrations on large tables".

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AuditLog: (tenantId) → (tenantId, createdAt) — serves "latest first" and tenant filtering.
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
DROP INDEX IF EXISTS "AuditLog_tenantId_idx";

-- Customers page default sort.
CREATE INDEX IF NOT EXISTS "Customer_tenantId_totalSpent_idx" ON "Customer"("tenantId", "totalSpent");

-- Customer search (ILIKE '%term%' can't use a btree).
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer" USING GIN ("phone" gin_trgm_ops);

-- Storefront slug lookup (websiteSlug OR website OR domain).
CREATE INDEX IF NOT EXISTS "Tenant_website_idx" ON "Tenant"("website");

-- Kitchen Queue poll.
CREATE INDEX IF NOT EXISTS "Transaction_tenantId_kitchenStatus_idx" ON "Transaction"("tenantId", "kitchenStatus");
