-- Leads submitted through the CafeOS marketing site's own /contact form. Platform-level, not
-- tenant-scoped — distinct from the existing per-tenant ContactLead table.
CREATE TABLE "MarketingLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingLead_createdAt_idx" ON "MarketingLead"("createdAt");
