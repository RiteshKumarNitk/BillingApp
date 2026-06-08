-- Add tokenVersion to User and version to Tenant
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tenant" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
