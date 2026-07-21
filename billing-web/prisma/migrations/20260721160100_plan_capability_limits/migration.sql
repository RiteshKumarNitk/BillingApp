ALTER TABLE "SubscriptionPlan" ADD COLUMN "maxTables" INTEGER NOT NULL DEFAULT -1;
ALTER TABLE "SubscriptionPlan" ADD COLUMN "allowedThemes" TEXT[] NOT NULL DEFAULT '{}';
