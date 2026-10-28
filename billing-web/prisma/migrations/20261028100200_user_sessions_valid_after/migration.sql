-- Staff session revocation: sessions/tokens authenticated before this timestamp are rejected.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "sessionsValidAfter" TIMESTAMP(3);
