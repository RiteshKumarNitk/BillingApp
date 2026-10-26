-- P2/D1: TransactionItem had no index on either foreign key, so invoice loads and every report
-- join over line items did a full table scan.

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionItem_productId_idx" ON "TransactionItem"("productId");
