-- Page visibility toggles for the tenant website builder (About/Shop/Contact enable-disable).
ALTER TABLE "Website" ADD COLUMN "pages" JSONB;
