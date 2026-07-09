-- Defense-in-depth: prevent stock from ever going negative at the database level,
-- even if application-layer validation is bypassed or has a bug.
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_stock_nonnegative" CHECK ("stock" >= 0);
