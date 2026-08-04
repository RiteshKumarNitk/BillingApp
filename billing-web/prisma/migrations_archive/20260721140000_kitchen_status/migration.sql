-- CafeOS Phase 9: Kitchen Queue. Lets a POS Transaction carry a kitchen-prep status independent
-- of its (already-paid) billing status.

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "kitchenStatus" TEXT;
