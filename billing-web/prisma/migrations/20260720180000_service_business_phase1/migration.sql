-- Phase 1 of the service-business pivot (Cafe/Laundry/Salon). All columns nullable — existing
-- tenants/products are unaffected until they explicitly opt into a business type.
ALTER TABLE "Tenant" ADD COLUMN "businessType" TEXT;
ALTER TABLE "Product" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Product" ADD COLUMN "garmentType" TEXT;
