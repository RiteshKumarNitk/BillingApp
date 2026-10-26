-- S5: Tenant.dbConnectionString was a leftover from a planned database-per-tenant design that was
-- never built. Nothing ever read it, and every write path stored a placeholder ('', 'default',
-- 'system_default', 'demo_default'), so dropping it loses no real data — and removes a column
-- that would otherwise invite storing a plaintext credential later.

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "dbConnectionString";
