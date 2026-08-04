// Shared by every screen that decides whether a stock number counts as "out of stock" (public
// shop, POS product picker, admin Products list) — previously each screen repeated its own
// `stock <= 0` check inline. `inventoryMode` is always the PARENT PRODUCT's mode (variants don't
// have their own — see the schema comment on Product.inventoryMode); callers keep their own
// productType exclusions (SERVICE/COMBO/VARIANT-base-level) since those differ slightly per screen.
// AUTO_REFILL genuinely depletes and blocks a sale at 0 stock, same as INVENTORY_MANAGED (see
// transactions.ts's decrement guard) — only ALWAYS_AVAILABLE is exempt. Treating AUTO_REFILL as
// "never out of stock" here would show it as orderable in the UI right up until checkout fails
// with "Insufficient stock," a real mismatch caught during Phase 2 verification.
export function isOutOfStock(stock: number, inventoryMode?: string | null): boolean {
  if (inventoryMode === "ALWAYS_AVAILABLE") return false;
  return stock <= 0;
}

// Does a product carry sellable stock at all? ALWAYS_AVAILABLE items never have meaningful stock,
// and SERVICE/COMBO items never carry stock of their own (see the Product model comment). Shared
// by the online-order path and the kitchen COMPLETE / merchant APPROVE handlers so the rule can't
// drift between them.
export function productTracksStock(product: {
  productType: string | null;
  inventoryMode: string | null;
}): boolean {
  if (product.inventoryMode === "ALWAYS_AVAILABLE") return false;
  return product.productType !== "SERVICE" && product.productType !== "COMBO";
}

export function inventoryModeLabel(inventoryMode?: string | null, autoRefillQuantity?: number | null): string {
  switch (inventoryMode) {
    case "ALWAYS_AVAILABLE":
      return "Always available";
    case "AUTO_REFILL":
      return autoRefillQuantity ? `Refills daily to ${autoRefillQuantity}` : "Auto refill";
    default:
      return "Inventory managed";
  }
}
