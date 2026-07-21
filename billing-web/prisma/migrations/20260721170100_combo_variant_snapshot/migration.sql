-- Combo architecture fixes: variant-specific combo components + sale-time snapshot (mirrors
-- TransactionItem.selectedAddOns) so kitchen/receipt can show combo contents without live-joining
-- ComboItem (which would let a later recipe edit silently rewrite historical orders).

ALTER TABLE "ComboItem" ADD COLUMN "componentVariantId" TEXT;
CREATE INDEX "ComboItem_componentVariantId_idx" ON "ComboItem"("componentVariantId");
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_componentVariantId_fkey"
  FOREIGN KEY ("componentVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TransactionItem" ADD COLUMN "comboComponents" JSONB;
ALTER TABLE "OrderRequestItem" ADD COLUMN "comboComponents" JSONB;
