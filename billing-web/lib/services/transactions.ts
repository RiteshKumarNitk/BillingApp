import prisma from "@/lib/prisma";
import type { Prisma } from "../../generated/prisma";
import { checkFeatureLimit } from "@/lib/subscription";
import { findOrCreateCustomerByPhone } from "@/lib/actions/customers";

export class TransactionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// 1 loyalty point = ₹1 of discount when redeemed; 1 point earned per ₹100 of net spend.
const LOYALTY_POINT_VALUE = 1;
const LOYALTY_EARN_RATE = 100;

interface SelectedAddOnInput {
  id?: string;
  name: string;
  price: number | string;
}

interface CreateTransactionItemInput {
  productId: string;
  quantity: number | string;
  salePrice: number | string;
  discountAmount?: number | string;
  variantId?: string | null;
  batchId?: string | null;
  serialId?: string | null;
  titleOverride?: string;
  name?: string;
  purchasePrice?: number | string;
  mrp?: number | string;
  productType?: string;
  barcode?: string;
  // Cafe: add-ons selected for this line item (e.g. "Extra Shot"). Validated against the
  // product's real ProductAddOn rows and folded into the price-override check below.
  selectedAddOns?: SelectedAddOnInput[];
}

interface PaymentInput {
  method: string;
  amount: number | string;
}

interface CreateTransactionParams {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  items: CreateTransactionItemInput[];
  discount?: number | string;
  taxAmount?: number | string;
  paymentMethod?: string | null;
  amountReceived?: number | string | null;
  changeAmount?: number | string | null;
  payments?: PaymentInput[] | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  couponCode?: string | null;
  loyaltyPointsRedeemed?: number | string | null;
  // Cafe POS. Nullable/ignored by every other business type.
  tableNumber?: string | null;
  orderType?: string | null;
}

function parseOptionalAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createTransaction(params: CreateTransactionParams) {
  const plan = await buildTransactionPlan(params);
  return prisma.$transaction((tx) => executeTransactionPlan(tx, plan));
}

// Computes everything about a sale that doesn't require mutating the database: item pricing
// (including the OVERRIDE_PRICE check), coupon/loyalty validation, and totals. Split out from
// createTransaction so resumeBill can run this once and then wrap the actual mutation together
// with deleting the held-bill record in a single atomic transaction (see resumeBill below).
async function buildTransactionPlan(params: CreateTransactionParams) {
  const {
    tenantId, userId, role, permissions,
    items, discount = 0, taxAmount = 0,
    paymentMethod, amountReceived, changeAmount, payments,
    customerId, customerName, customerPhone, notes,
    couponCode, loyaltyPointsRedeemed,
    tableNumber, orderType,
  } = params;

  if (role !== "SUPERADMIN" && !permissions.includes("CREATE_BILL")) {
    throw new TransactionError("Forbidden: Requires CREATE_BILL permission", 403);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new TransactionError("Items are required and must be a non-empty array", 400);
  }

  // Every completed sale must be linked to a real customer (find-or-create by phone) — no more
  // walk-in/anonymous invoices. Resolves customerId from the phone regardless of what the caller
  // passed in, so a stale/mismatched customerId from the client can never diverge from the phone
  // actually entered at checkout.
  if (!customerPhone || !customerPhone.trim()) {
    throw new TransactionError("Customer mobile number is required", 400);
  }
  let resolvedCustomer;
  try {
    resolvedCustomer = await findOrCreateCustomerByPhone(tenantId, customerPhone, customerName);
  } catch (err: any) {
    throw new TransactionError(err.message || "Invalid customer mobile number", 400);
  }

  const limitCheck = await checkFeatureLimit(tenantId, "transactions");
  if (!limitCheck.allowed) {
    throw new TransactionError(limitCheck.reason || "Transaction limit reached", 403);
  }

  const canOverridePrice = role === "SUPERADMIN" || permissions.includes("OVERRIDE_PRICE");

  const parsedItems = items.map((item) => {
    const quantity = parseFloat(String(item.quantity));
    const requestedSalePrice = parseFloat(String(item.salePrice));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TransactionError(`Invalid quantity for item ${item.productId}`, 400);
    }
    if (!Number.isFinite(requestedSalePrice) || requestedSalePrice < 0) {
      throw new TransactionError(`Invalid sale price for item ${item.productId}`, 400);
    }

    return {
      productId: item.productId,
      name: item.titleOverride || item.name || "Product",
      barcode: item.barcode || "",
      quantity,
      requestedSalePrice,
      discountAmountInput: parseFloat(String(item.discountAmount ?? 0)) || 0,
      variantId: item.variantId || null,
      batchId: item.batchId || null,
      serialId: item.serialId || null,
      productType: item.productType,
      selectedAddOns: item.selectedAddOns || [],
    };
  });

  const uniqueProductIds = Array.from(new Set(parsedItems.map((i) => i.productId)));
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, tenantId },
    select: {
      id: true,
      category: true,
      salePrice: true,
      purchasePrice: true,
      mrp: true,
      inventoryMode: true,
      variants: { select: { id: true, salePrice: true, purchasePrice: true, mrp: true } },
      addOns: { select: { id: true, name: true, price: true } },
      comboComponents: {
        select: {
          quantity: true,
          component: { select: { name: true } },
          componentVariant: { select: { name: true } },
        },
      },
    },
  });
  if (ownedProducts.length !== uniqueProductIds.length) {
    throw new TransactionError("Unauthorized: One or more products do not belong to your tenant", 403);
  }
  const productById = new Map(ownedProducts.map((p) => [p.id, p]));
  const categoryByProductId = new Map(ownedProducts.map((p) => [p.id, p.category]));

  // purchasePrice/mrp are cost-basis figures used for profit reporting — always taken from the
  // catalog (Product, or ProductVariant for VARIANT-type items), never from the client.
  // salePrice is the one price a cashier can actually change in the cart UI, so it's the only
  // field checked against the catalog: if it doesn't match and the caller lacks OVERRIDE_PRICE,
  // the sale is rejected outright rather than silently corrected, so the client can surface a
  // clear "price changed" error instead of quietly charging the wrong amount.
  const normalizedItems = parsedItems.map((item) => {
    const product = productById.get(item.productId)!;
    let catalogSalePrice = product.salePrice;
    let purchasePrice = product.purchasePrice;
    let mrp = product.mrp;

    if (item.productType === "VARIANT" && item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new TransactionError(`Variant not found for item ${item.name}`, 400);
      }
      catalogSalePrice = variant.salePrice;
      purchasePrice = variant.purchasePrice;
      mrp = variant.mrp;
    }

    // Cafe: each selected add-on must be a real ProductAddOn on this product — the client sends
    // a name for display, but price is always re-resolved from the catalog, same rule as the
    // base item.
    const resolvedAddOns = item.selectedAddOns.map((selected) => {
      const catalogAddOn = product.addOns.find((a) => a.id === selected.id || a.name === selected.name);
      if (!catalogAddOn) {
        throw new TransactionError(`Add-on "${selected.name}" not found for item ${item.name}`, 400);
      }
      return { name: catalogAddOn.name, price: catalogAddOn.price };
    });
    const addOnsTotal = resolvedAddOns.reduce((sum, a) => sum + a.price, 0);
    catalogSalePrice += addOnsTotal;

    const priceOverridden = Math.abs(item.requestedSalePrice - catalogSalePrice) > 0.01;
    if (priceOverridden && !canOverridePrice) {
      throw new TransactionError(
        `Requires OVERRIDE_PRICE permission to sell "${item.name}" at a price different from the catalog`,
        403
      );
    }

    const salePrice = priceOverridden ? item.requestedSalePrice : catalogSalePrice;
    const itemTotal = item.quantity * salePrice;

    if (item.discountAmountInput < 0 || item.discountAmountInput > itemTotal) {
      throw new TransactionError(`Invalid discount for item ${item.name}`, 400);
    }

    // Cafe: a COMBO's contents are never client-selectable — always the catalog's current combo
    // definition, snapshotted here so a later recipe edit never rewrites this sale's receipt.
    const resolvedComboComponents = item.productType === "COMBO"
      ? product.comboComponents.map((c) => ({
          name: c.component.name,
          variantName: c.componentVariant?.name ?? null,
          quantity: c.quantity,
        }))
      : [];

    return {
      productId: item.productId,
      name: item.name,
      barcode: item.barcode,
      purchasePrice,
      mrp,
      salePrice,
      quantity: item.quantity,
      itemTotal,
      discountAmount: item.discountAmountInput,
      variantId: item.variantId,
      batchId: item.batchId,
      serialId: item.serialId,
      productType: item.productType,
      selectedAddOns: resolvedAddOns,
      comboComponents: resolvedComboComponents,
      // Variants inherit the parent product's mode — there's no separate per-variant mode (see
      // schema comment on Product.inventoryMode).
      inventoryMode: product.inventoryMode,
    };
  });

  const grossTotal = normalizedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const itemDiscountTotal = normalizedItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const subtotalAfterItemDiscounts = grossTotal - itemDiscountTotal;

  const discountValue = parseFloat(String(discount)) || 0;
  const taxValue = parseFloat(String(taxAmount)) || 0;

  // --- Coupon / campaign discount ---
  let couponDiscountAmount = 0;
  let resolvedCouponCode: string | null = null;
  if (couponCode) {
    const campaign = await prisma.discount.findFirst({
      where: { tenantId, code: { equals: couponCode, mode: "insensitive" }, isActive: true },
    });
    if (!campaign) {
      throw new TransactionError("Invalid or inactive coupon code", 400);
    }
    const now = new Date();
    if (campaign.startDate && now < campaign.startDate) {
      throw new TransactionError("Coupon is not active yet", 400);
    }
    if (campaign.endDate && now > campaign.endDate) {
      throw new TransactionError("Coupon has expired", 400);
    }

    const eligibleItems = campaign.applicableCategory
      ? normalizedItems.filter((i) => categoryByProductId.get(i.productId) === campaign.applicableCategory)
      : normalizedItems;

    const eligibleQuantity = eligibleItems.reduce((sum, i) => sum + i.quantity, 0);
    if (eligibleQuantity < campaign.minimumQuantity) {
      throw new TransactionError(
        `Coupon requires a minimum quantity of ${campaign.minimumQuantity} eligible item(s)`,
        400
      );
    }

    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + (i.itemTotal - i.discountAmount), 0);
    couponDiscountAmount = (eligibleSubtotal * campaign.discountPercentage) / 100;
    resolvedCouponCode = campaign.code;
  }

  // --- Bill-level percentage discount (existing behavior, applied after coupon) ---
  const billDiscountAmount =
    ((subtotalAfterItemDiscounts - couponDiscountAmount) * discountValue) / 100;

  // --- Loyalty points redemption ---
  const requestedLoyaltyRedemption = Math.max(0, Math.floor(Number(loyaltyPointsRedeemed) || 0));
  let loyaltyDiscountAmount = 0;

  if (requestedLoyaltyRedemption > 0) {
    if (resolvedCustomer.loyaltyPoints < requestedLoyaltyRedemption) {
      throw new TransactionError("Insufficient loyalty points", 400);
    }
    loyaltyDiscountAmount = requestedLoyaltyRedemption * LOYALTY_POINT_VALUE;
  }

  const netAmount = Math.max(
    0,
    subtotalAfterItemDiscounts - couponDiscountAmount - billDiscountAmount - loyaltyDiscountAmount + taxValue
  );

  const loyaltyPointsEarned = Math.floor(netAmount / LOYALTY_EARN_RATE);

  // --- Payment(s) ---
  // Split-payment path: caller sends `payments: [{method, amount}, ...]`. Falls back to the
  // original single paymentMethod/amountReceived/changeAmount shape when omitted, so existing
  // callers (mobile) that don't know about split payments keep working unchanged.
  let resolvedPaymentMethod: string | null = paymentMethod || null;
  let resolvedAmountReceived: number | null = parseOptionalAmount(amountReceived);
  let resolvedChangeAmount: number | null = parseOptionalAmount(changeAmount);
  let normalizedPayments: { method: string; amount: number }[] = [];

  if (Array.isArray(payments) && payments.length > 0) {
    normalizedPayments = payments.map((p) => {
      const amount = parseFloat(String(p.amount));
      if (!p.method || !Number.isFinite(amount) || amount <= 0) {
        throw new TransactionError("Each payment requires a valid method and a positive amount", 400);
      }
      return { method: p.method, amount };
    });

    const paidTotal = normalizedPayments.reduce((sum, p) => sum + p.amount, 0);
    if (paidTotal < netAmount - 0.01) {
      throw new TransactionError(
        `Total payments (₹${paidTotal.toFixed(2)}) do not cover the net amount (₹${netAmount.toFixed(2)})`,
        400
      );
    }

    resolvedPaymentMethod = normalizedPayments.length > 1 ? "MIXED" : normalizedPayments[0].method;
    resolvedAmountReceived = paidTotal;
    resolvedChangeAmount = Math.max(0, paidTotal - netAmount);
  }

  return {
    tenantId,
    userId,
    grossTotal,
    discountValue,
    taxValue,
    netAmount,
    resolvedPaymentMethod,
    resolvedAmountReceived,
    resolvedChangeAmount,
    customerId: resolvedCustomer.id,
    customerName: resolvedCustomer.name,
    customerPhone: resolvedCustomer.phone,
    notes: notes || null,
    tableNumber: tableNumber || null,
    orderType: orderType || null,
    resolvedCouponCode,
    couponDiscountAmount,
    requestedLoyaltyRedemption,
    loyaltyDiscountAmount,
    loyaltyPointsEarned,
    normalizedItems,
    normalizedPayments,
  };
}

// Executes the mutating half of a sale (insert + stock/loyalty updates) against a caller-supplied
// transaction client. Kept separate from buildTransactionPlan so resumeBill can run this and the
// held-record delete inside one shared `prisma.$transaction`.
async function executeTransactionPlan(
  tx: Prisma.TransactionClient,
  plan: Awaited<ReturnType<typeof buildTransactionPlan>>
) {
  const {
    tenantId, userId, grossTotal, discountValue, taxValue, netAmount,
    resolvedPaymentMethod, resolvedAmountReceived, resolvedChangeAmount,
    customerId, customerName, customerPhone, notes, tableNumber, orderType,
    resolvedCouponCode, couponDiscountAmount,
    requestedLoyaltyRedemption, loyaltyDiscountAmount, loyaltyPointsEarned,
    normalizedItems, normalizedPayments,
  } = plan;

  // Re-check the monthly quota against the same connection/transaction that's about to insert
  // the row, right before inserting it — narrows the race window from "the whole request" (the
  // check in buildTransactionPlan, before any of the coupon/pricing work) down to just this
  // instant.
  const limitRecheck = await checkFeatureLimit(tenantId, "transactions", tx);
  if (!limitRecheck.allowed) {
    throw new TransactionError(limitRecheck.reason || "Transaction limit reached", 403);
  }

  const created = await tx.transaction.create({
    data: {
      tenantId,
      userId,
      totalAmount: grossTotal,
      discount: discountValue,
      taxAmount: taxValue,
      netAmount,
      status: "COMPLETED",
      paymentMethod: resolvedPaymentMethod,
      amountReceived: resolvedAmountReceived,
      changeAmount: resolvedChangeAmount,
      customerId,
      customerName,
      customerPhone,
      notes,
      tableNumber,
      orderType,
      // Cafe Kitchen Queue: any completed sale with an orderType (only ever set by the Cafe POS)
      // needs the kitchen to actually make it, regardless of payment already being done. Every
      // other business type never sets orderType, so this stays null for them — no queue clutter.
      kitchenStatus: orderType ? "PREPARING" : null,
      couponCode: resolvedCouponCode,
      couponDiscountAmount,
      loyaltyPointsRedeemed: requestedLoyaltyRedemption,
      loyaltyDiscountAmount,
      loyaltyPointsEarned,
      items: {
        create: normalizedItems.map((item) => ({
          product: { connect: { id: item.productId } },
          name: item.name,
          barcode: item.barcode,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp,
          salePrice: item.salePrice,
          quantity: item.quantity,
          itemTotal: item.itemTotal,
          discountAmount: item.discountAmount,
          productType: item.productType || null,
          variantId: item.variantId,
          batchId: item.batchId,
          serialId: item.serialId,
          selectedAddOns: item.selectedAddOns.length > 0 ? item.selectedAddOns : undefined,
          comboComponents: item.comboComponents.length > 0 ? item.comboComponents : undefined,
        })),
      },
      ...(normalizedPayments.length > 0
        ? { payments: { create: normalizedPayments.map((p) => ({ method: p.method, amount: p.amount })) } }
        : {}),
    },
    include: { items: true, payments: true },
  });

  for (const item of normalizedItems) {
    // Always Available / Auto Refill items never block a sale or lose stock on one — Auto Refill's
    // depletion tracking still happens (its stock number is real and meaningful for the daily
    // reset), so it's excluded from this skip; only Always Available skips the decrement entirely.
    if (item.inventoryMode === "ALWAYS_AVAILABLE") {
      continue;
    }
    if (item.productType === "VARIANT") {
      if (!item.variantId) {
        throw new TransactionError(`Missing variant selection for ${item.name}`, 400);
      }
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
      }
    } else if (item.productType === "BATCH") {
      if (!item.batchId) {
        throw new TransactionError(`Missing batch selection for ${item.name}`, 400);
      }
      const result = await tx.productBatch.updateMany({
        where: { id: item.batchId, productId: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
      }
    } else if (item.productType === "SERIAL") {
      if (!item.serialId) {
        throw new TransactionError(`Missing serial selection for ${item.name}`, 400);
      }
      const result = await tx.productSerial.updateMany({
        where: { id: item.serialId, productId: item.productId, status: "AVAILABLE" },
        data: { status: "SOLD" },
      });
      if (result.count === 0) {
        throw new TransactionError(`Serial item unavailable for ${item.name}`, 409);
      }
    } else if (item.productType !== "SERVICE" && item.productType !== "COMBO") {
      // SIMPLE / WEIGHT / unspecified -> decrement base product stock. SERVICE and COMBO (Cafe)
      // never carry their own stock — combo component-level deduction is deferred (see the
      // ComboItem model comment in schema.prisma).
      const result = await tx.product.updateMany({
        where: { id: item.productId, tenantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
      }
    }
  }

  if (customerId) {
    const netPointsChange = loyaltyPointsEarned - requestedLoyaltyRedemption;
    const customerUpdate = await tx.customer.updateMany({
      where: {
        id: customerId,
        tenantId,
        ...(requestedLoyaltyRedemption > 0 ? { loyaltyPoints: { gte: requestedLoyaltyRedemption } } : {}),
      },
      data: {
        loyaltyPoints: { increment: netPointsChange },
        totalSpent: { increment: netAmount },
        lastPurchaseDate: new Date(),
      },
    });
    if (customerUpdate.count === 0 && requestedLoyaltyRedemption > 0) {
      // Another concurrent checkout already spent these points.
      throw new TransactionError("Insufficient loyalty points", 409);
    }
  }

  return created;
}

interface HoldBillParams {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  items: CreateTransactionItemInput[];
  discount?: number | string;
  taxAmount?: number | string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  couponCode?: string | null;
  loyaltyPointsRedeemed?: number | string | null;
  tableNumber?: string | null;
  orderType?: string | null;
}

// Holds a bill without touching stock or loyalty points — those are only ever mutated when the
// bill actually completes (see resumeBill), matching the plan's "no stock reservation" design.
// Coupon/loyalty inputs are stored as-entered but not validated here; validation happens for
// real at resume time so a coupon that expired or points that got spent elsewhere while the
// bill sat held are caught before the sale is finalized.
export async function holdBill(params: HoldBillParams) {
  const {
    tenantId, userId, role, permissions,
    items, discount = 0, taxAmount = 0,
    customerId, customerName, customerPhone, notes,
    couponCode, loyaltyPointsRedeemed,
    tableNumber, orderType,
  } = params;

  if (role !== "SUPERADMIN" && !permissions.includes("CREATE_BILL")) {
    throw new TransactionError("Forbidden: Requires CREATE_BILL permission", 403);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new TransactionError("Items are required and must be a non-empty array", 400);
  }

  const canOverridePrice = role === "SUPERADMIN" || permissions.includes("OVERRIDE_PRICE");

  const parsedItems = items.map((item) => {
    const quantity = parseFloat(String(item.quantity));
    const requestedSalePrice = parseFloat(String(item.salePrice));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TransactionError(`Invalid quantity for item ${item.productId}`, 400);
    }
    if (!Number.isFinite(requestedSalePrice) || requestedSalePrice < 0) {
      throw new TransactionError(`Invalid sale price for item ${item.productId}`, 400);
    }
    return {
      productId: item.productId,
      name: item.titleOverride || item.name || "Product",
      barcode: item.barcode || "",
      quantity,
      requestedSalePrice,
      discountAmountInput: parseFloat(String(item.discountAmount ?? 0)) || 0,
      productType: item.productType || null,
      variantId: item.variantId || null,
      batchId: item.batchId || null,
      serialId: item.serialId || null,
      selectedAddOns: item.selectedAddOns || [],
    };
  });

  const uniqueProductIds = Array.from(new Set(parsedItems.map((i) => i.productId)));
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, tenantId },
    select: {
      id: true,
      salePrice: true,
      purchasePrice: true,
      mrp: true,
      variants: { select: { id: true, salePrice: true, purchasePrice: true, mrp: true } },
      addOns: { select: { id: true, name: true, price: true } },
      comboComponents: {
        select: {
          quantity: true,
          component: { select: { name: true } },
          componentVariant: { select: { name: true } },
        },
      },
    },
  });
  if (ownedProducts.length !== uniqueProductIds.length) {
    throw new TransactionError("Unauthorized: One or more products do not belong to your tenant", 403);
  }
  const productById = new Map(ownedProducts.map((p) => [p.id, p]));

  // Same authoritative-pricing rule as createTransaction (see comment there) — held bills go
  // through the full re-validation in resumeBill/createTransaction anyway, but enforcing it here
  // too means a caller without OVERRIDE_PRICE gets a clear error at hold time instead of a bill
  // that silently can't ever be resumed.
  const normalizedItems = parsedItems.map((item) => {
    const product = productById.get(item.productId)!;
    let catalogSalePrice = product.salePrice;
    let purchasePrice = product.purchasePrice;
    let mrp = product.mrp;

    if (item.productType === "VARIANT" && item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new TransactionError(`Variant not found for item ${item.name}`, 400);
      }
      catalogSalePrice = variant.salePrice;
      purchasePrice = variant.purchasePrice;
      mrp = variant.mrp;
    }

    const resolvedAddOns = item.selectedAddOns.map((selected) => {
      const catalogAddOn = product.addOns.find((a) => a.id === selected.id || a.name === selected.name);
      if (!catalogAddOn) {
        throw new TransactionError(`Add-on "${selected.name}" not found for item ${item.name}`, 400);
      }
      return { name: catalogAddOn.name, price: catalogAddOn.price };
    });
    const addOnsTotal = resolvedAddOns.reduce((sum, a) => sum + a.price, 0);
    catalogSalePrice += addOnsTotal;

    const priceOverridden = Math.abs(item.requestedSalePrice - catalogSalePrice) > 0.01;
    if (priceOverridden && !canOverridePrice) {
      throw new TransactionError(
        `Requires OVERRIDE_PRICE permission to sell "${item.name}" at a price different from the catalog`,
        403
      );
    }

    const salePrice = priceOverridden ? item.requestedSalePrice : catalogSalePrice;
    const itemTotal = item.quantity * salePrice;

    if (item.discountAmountInput < 0 || item.discountAmountInput > itemTotal) {
      throw new TransactionError(`Invalid discount for item ${item.name}`, 400);
    }

    const resolvedComboComponents = item.productType === "COMBO"
      ? product.comboComponents.map((c) => ({
          name: c.component.name,
          variantName: c.componentVariant?.name ?? null,
          quantity: c.quantity,
        }))
      : [];

    return {
      productId: item.productId,
      name: item.name,
      barcode: item.barcode,
      purchasePrice,
      mrp,
      salePrice,
      quantity: item.quantity,
      itemTotal,
      discountAmount: item.discountAmountInput,
      productType: item.productType,
      variantId: item.variantId,
      batchId: item.batchId,
      serialId: item.serialId,
      selectedAddOns: resolvedAddOns,
      comboComponents: resolvedComboComponents,
    };
  });

  const grossTotal = normalizedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const itemDiscountTotal = normalizedItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const discountValue = parseFloat(String(discount)) || 0;
  const taxValue = parseFloat(String(taxAmount)) || 0;
  // Preview only — a rough net amount for the Held Bills list. Coupon/loyalty are deliberately
  // excluded since they aren't validated until resume; the real total is computed there.
  const previewNetAmount = Math.max(
    0,
    (grossTotal - itemDiscountTotal) * (1 - discountValue / 100) + taxValue
  );

  const held = await prisma.transaction.create({
    data: {
      tenantId,
      userId,
      status: "HELD",
      totalAmount: grossTotal,
      discount: discountValue,
      taxAmount: taxValue,
      netAmount: previewNetAmount,
      customerId: customerId || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      notes: notes || null,
      tableNumber: tableNumber || null,
      orderType: orderType || null,
      couponCode: couponCode || null,
      loyaltyPointsRedeemed: Math.max(0, Math.floor(Number(loyaltyPointsRedeemed) || 0)),
      items: {
        create: normalizedItems.map((item) => ({
          product: { connect: { id: item.productId } },
          name: item.name,
          barcode: item.barcode,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp,
          salePrice: item.salePrice,
          quantity: item.quantity,
          itemTotal: item.itemTotal,
          discountAmount: item.discountAmount,
          productType: item.productType,
          variantId: item.variantId,
          batchId: item.batchId,
          serialId: item.serialId,
          selectedAddOns: item.selectedAddOns.length > 0 ? item.selectedAddOns : undefined,
          comboComponents: item.comboComponents.length > 0 ? item.comboComponents : undefined,
        })),
      },
    },
    include: { items: true },
  });

  return held;
}

export async function listHeldBills(tenantId: string) {
  return prisma.transaction.findMany({
    where: { tenantId, status: "HELD" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteHeldBill(
  transactionId: string,
  tenantId: string,
  role: string,
  permissions: string[]
) {
  if (role !== "SUPERADMIN" && !permissions.includes("CREATE_BILL")) {
    throw new TransactionError("Forbidden: Requires CREATE_BILL permission", 403);
  }
  const held = await prisma.transaction.findFirst({ where: { id: transactionId, tenantId, status: "HELD" } });
  if (!held) {
    throw new TransactionError("Held bill not found", 404);
  }
  await prisma.transactionItem.deleteMany({ where: { transactionId } });
  await prisma.transaction.delete({ where: { id: transactionId } });
}

interface ResumeBillParams {
  transactionId: string;
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  paymentMethod?: string | null;
  amountReceived?: number | string | null;
  changeAmount?: number | string | null;
  payments?: PaymentInput[] | null;
  // A held bill doesn't require a customer (see holdBill) — completing one now does, so the POS
  // can supply/correct the phone at resume time if the held record never had one.
  customerPhone?: string | null;
  customerName?: string | null;
}

// Completes a previously-held bill by re-running the full checkout validation (same
// buildTransactionPlan used by createTransaction) — stock, coupon validity, and loyalty balance
// are all re-checked at this point, not at hold time.
export async function resumeBill(params: ResumeBillParams) {
  const {
    transactionId, tenantId, userId, role, permissions,
    paymentMethod, amountReceived, changeAmount, payments,
    customerPhone, customerName,
  } = params;

  const held = await prisma.transaction.findFirst({
    where: { id: transactionId, tenantId, status: "HELD" },
    include: { items: true },
  });
  if (!held) {
    throw new TransactionError("Held bill not found", 404);
  }

  const items: CreateTransactionItemInput[] = held.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    salePrice: item.salePrice,
    discountAmount: item.discountAmount,
    variantId: item.variantId,
    batchId: item.batchId,
    serialId: item.serialId,
    titleOverride: item.name,
    purchasePrice: item.purchasePrice,
    mrp: item.mrp,
    productType: item.productType || undefined,
    barcode: item.barcode,
    selectedAddOns: Array.isArray(item.selectedAddOns) ? (item.selectedAddOns as unknown as SelectedAddOnInput[]) : [],
  }));

  const plan = await buildTransactionPlan({
    tenantId,
    userId,
    role,
    permissions,
    items,
    discount: held.discount,
    taxAmount: held.taxAmount,
    paymentMethod,
    amountReceived,
    changeAmount,
    payments,
    customerName: customerName || held.customerName,
    customerPhone: customerPhone || held.customerPhone,
    notes: held.notes,
    couponCode: held.couponCode,
    loyaltyPointsRedeemed: held.loyaltyPointsRedeemed,
    tableNumber: held.tableNumber,
    orderType: held.orderType,
  });

  // Completing the sale and deleting the held record happen inside one transaction: if the
  // delete fails for any reason, the newly-created sale and its stock/loyalty side effects roll
  // back too, instead of leaving a duplicate/resumable HELD record after stock has already been
  // spent.
  return prisma.$transaction(async (tx) => {
    const created = await executeTransactionPlan(tx, plan);
    await tx.transactionItem.deleteMany({ where: { transactionId } });
    await tx.transaction.delete({ where: { id: transactionId } });
    return created;
  });
}

interface EditTransactionItemInput {
  productId: string;
  quantity: number | string;
  salePrice: number | string;
  discountAmount?: number | string;
  variantId?: string | null;
  titleOverride?: string;
  name?: string;
  productType?: string;
  barcode?: string;
  selectedAddOns?: SelectedAddOnInput[];
}

interface EditTransactionParams {
  transactionId: string;
  tenantId: string;
  userId: string; // the editor, not necessarily who created the sale
  role: string;
  permissions: string[];
  items: EditTransactionItemInput[];
  notes?: string | null;
  reason: string;
}

// Invoice Edit v1: item-level corrections only (quantity, remove, add, variant, notes) — the bill-
// level discount % and coupon/loyalty redemption are carried forward UNCHANGED from the original
// sale, not re-offered as edit inputs. That keeps a real correctness problem (reconciling a
// changed coupon/loyalty redemption against points already earned/spent) out of v1 scope; tax and
// the bill-level discount amount still recompute correctly because they're percentages/rates
// applied to the new item total, not frozen figures.
export async function editTransaction(params: EditTransactionParams) {
  const { transactionId, tenantId, userId, role, permissions, items, notes, reason } = params;

  if (role !== "SUPERADMIN" && !permissions.includes("EDIT_TRANSACTION")) {
    throw new TransactionError("Forbidden: Requires EDIT_TRANSACTION permission", 403);
  }
  if (!reason || !reason.trim()) {
    throw new TransactionError("A reason for the edit is required", 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new TransactionError("Items are required and must be a non-empty array", 400);
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, tenantId, status: "COMPLETED" },
    include: { items: true },
  });
  if (!existing) {
    throw new TransactionError("Invoice not found", 404);
  }

  const isSameDay = new Date(existing.createdAt).toDateString() === new Date().toDateString();
  if (!isSameDay && role !== "SUPERADMIN" && !permissions.includes("REOPEN_OLD_TRANSACTION")) {
    throw new TransactionError("Editing an invoice from a previous day requires the Reopen Old Invoice permission", 403);
  }

  const canOverridePrice = role === "SUPERADMIN" || permissions.includes("OVERRIDE_PRICE");

  const parsedItems = items.map((item) => {
    const quantity = parseFloat(String(item.quantity));
    const requestedSalePrice = parseFloat(String(item.salePrice));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TransactionError(`Invalid quantity for item ${item.productId}`, 400);
    }
    if (!Number.isFinite(requestedSalePrice) || requestedSalePrice < 0) {
      throw new TransactionError(`Invalid sale price for item ${item.productId}`, 400);
    }
    return {
      productId: item.productId,
      name: item.titleOverride || item.name || "Product",
      barcode: item.barcode || "",
      quantity,
      requestedSalePrice,
      discountAmountInput: parseFloat(String(item.discountAmount ?? 0)) || 0,
      variantId: item.variantId || null,
      productType: item.productType,
      selectedAddOns: item.selectedAddOns || [],
    };
  });

  const uniqueProductIds = Array.from(new Set(parsedItems.map((i) => i.productId)));
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, tenantId },
    select: {
      id: true,
      salePrice: true,
      purchasePrice: true,
      mrp: true,
      inventoryMode: true,
      gstRate: true,
      gstInclusive: true,
      variants: { select: { id: true, salePrice: true, purchasePrice: true, mrp: true } },
      addOns: { select: { id: true, name: true, price: true } },
    },
  });
  if (ownedProducts.length !== uniqueProductIds.length) {
    throw new TransactionError("Unauthorized: One or more products do not belong to your tenant", 403);
  }
  const productById = new Map(ownedProducts.map((p) => [p.id, p]));

  const normalizedItems = parsedItems.map((item) => {
    const product = productById.get(item.productId)!;
    let catalogSalePrice = product.salePrice;
    let purchasePrice = product.purchasePrice;
    let mrp = product.mrp;

    if (item.productType === "VARIANT" && item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new TransactionError(`Variant not found for item ${item.name}`, 400);
      }
      catalogSalePrice = variant.salePrice;
      purchasePrice = variant.purchasePrice;
      mrp = variant.mrp;
    }

    const resolvedAddOns = item.selectedAddOns.map((selected) => {
      const catalogAddOn = product.addOns.find((a) => a.id === selected.id || a.name === selected.name);
      if (!catalogAddOn) {
        throw new TransactionError(`Add-on "${selected.name}" not found for item ${item.name}`, 400);
      }
      return { name: catalogAddOn.name, price: catalogAddOn.price };
    });
    const addOnsTotal = resolvedAddOns.reduce((sum, a) => sum + a.price, 0);
    catalogSalePrice += addOnsTotal;

    const priceOverridden = Math.abs(item.requestedSalePrice - catalogSalePrice) > 0.01;
    if (priceOverridden && !canOverridePrice) {
      throw new TransactionError(
        `Requires OVERRIDE_PRICE permission to sell "${item.name}" at a price different from the catalog`,
        403
      );
    }

    const salePrice = priceOverridden ? item.requestedSalePrice : catalogSalePrice;
    const itemTotal = item.quantity * salePrice;

    if (item.discountAmountInput < 0 || item.discountAmountInput > itemTotal) {
      throw new TransactionError(`Invalid discount for item ${item.name}`, 400);
    }

    return {
      productId: item.productId,
      name: item.name,
      barcode: item.barcode,
      purchasePrice,
      mrp,
      salePrice,
      quantity: item.quantity,
      itemTotal,
      discountAmount: item.discountAmountInput,
      productType: item.productType || null,
      variantId: item.variantId,
      selectedAddOns: resolvedAddOns,
      inventoryMode: product.inventoryMode,
      // Exclusive-rate GST only — matches the POS UI's own client-side tax math (CafeBillingClient's
      // exclusiveTaxAmount), recomputed here server-side since an edit has no client cart to do it.
      gstAmount: product.gstRate && !product.gstInclusive ? (itemTotal * product.gstRate) / 100 : 0,
    };
  });

  const grossTotal = normalizedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const itemDiscountTotal = normalizedItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const subtotalAfterItemDiscounts = grossTotal - itemDiscountTotal;
  const taxValue = normalizedItems.reduce((sum, i) => sum + i.gstAmount, 0);

  // Bill-level discount % and coupon/loyalty amounts are carried forward from the original sale
  // (see the function's doc comment) — only their base changes, which is exactly "recalculate
  // discounts" for the parts this v1 supports.
  const discountValue = existing.discount;
  const billDiscountAmount = ((subtotalAfterItemDiscounts - existing.couponDiscountAmount) * discountValue) / 100;
  const netAmount = Math.max(
    0,
    subtotalAfterItemDiscounts - existing.couponDiscountAmount - billDiscountAmount - existing.loyaltyDiscountAmount + taxValue
  );

  const newLoyaltyPointsEarned = existing.customerId ? Math.floor(netAmount / LOYALTY_EARN_RATE) : 0;
  const loyaltyPointsEarnedDelta = newLoyaltyPointsEarned - existing.loyaltyPointsEarned;

  return prisma.$transaction(async (tx) => {
    // 1. Snapshot the full pre-edit state (transaction fields + items) — permanent, never mutated.
    await tx.transactionEditHistory.create({
      data: {
        transactionId,
        editedByUserId: userId,
        reason: reason.trim(),
        snapshotJson: JSON.parse(JSON.stringify({ transaction: existing, items: existing.items })),
      },
    });

    // 2. Reconcile stock deltas — match old vs new lines by productId+variantId. Increasing
    // quantity (or adding a new line) decrements the extra amount with the same insufficient-
    // stock guard as a fresh sale; decreasing (or removing a line) credits stock back. Skipped
    // entirely for ALWAYS_AVAILABLE, exactly like a normal sale.
    const lineKey = (productId: string, variantId: string | null) => `${productId}::${variantId ?? ""}`;
    const oldQtyByLine = new Map<string, number>();
    for (const item of existing.items) {
      const key = lineKey(item.productId, item.variantId);
      oldQtyByLine.set(key, (oldQtyByLine.get(key) || 0) + item.quantity);
    }
    const newQtyByLine = new Map<string, number>();
    for (const item of normalizedItems) {
      const key = lineKey(item.productId, item.variantId);
      newQtyByLine.set(key, (newQtyByLine.get(key) || 0) + item.quantity);
    }
    const allLineKeys = new Set([...oldQtyByLine.keys(), ...newQtyByLine.keys()]);
    const inventoryModeByProductId = new Map(ownedProducts.map((p) => [p.id, p.inventoryMode]));

    for (const key of allLineKeys) {
      const [productId, variantIdRaw] = key.split("::");
      const variantId = variantIdRaw || null;
      const oldQty = oldQtyByLine.get(key) || 0;
      const newQty = newQtyByLine.get(key) || 0;
      const delta = newQty - oldQty;
      if (delta === 0) continue;

      const inventoryMode = inventoryModeByProductId.get(productId) ?? "INVENTORY_MANAGED";
      if (inventoryMode === "ALWAYS_AVAILABLE") continue;

      if (variantId) {
        if (delta > 0) {
          const result = await tx.productVariant.updateMany({
            where: { id: variantId, productId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (result.count === 0) throw new TransactionError(`Insufficient stock to increase quantity for this item`, 409);
        } else {
          await tx.productVariant.updateMany({ where: { id: variantId, productId }, data: { stock: { increment: -delta } } });
        }
      } else {
        if (delta > 0) {
          const result = await tx.product.updateMany({
            where: { id: productId, tenantId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (result.count === 0) throw new TransactionError(`Insufficient stock to increase quantity for this item`, 409);
        } else {
          await tx.product.updateMany({ where: { id: productId, tenantId }, data: { stock: { increment: -delta } } });
        }
      }
    }

    // 3. Reconcile loyalty points earned (redemption is frozen — see doc comment) and totalSpent.
    if (existing.customerId) {
      await tx.customer.updateMany({
        where: { id: existing.customerId, tenantId },
        data: {
          loyaltyPoints: { increment: loyaltyPointsEarnedDelta },
          totalSpent: { increment: netAmount - existing.netAmount },
        },
      });
    }

    // 4. Replace the item lines and update the transaction's own totals + edit metadata.
    await tx.transactionItem.deleteMany({ where: { transactionId } });
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        totalAmount: grossTotal,
        taxAmount: taxValue,
        netAmount,
        loyaltyPointsEarned: newLoyaltyPointsEarned,
        notes: notes ?? existing.notes,
        editedAt: new Date(),
        editedByUserId: userId,
        editCount: { increment: 1 },
        items: {
          create: normalizedItems.map((item) => ({
            product: { connect: { id: item.productId } },
            name: item.name,
            barcode: item.barcode,
            purchasePrice: item.purchasePrice,
            mrp: item.mrp,
            salePrice: item.salePrice,
            quantity: item.quantity,
            itemTotal: item.itemTotal,
            discountAmount: item.discountAmount,
            productType: item.productType,
            variantId: item.variantId,
            selectedAddOns: item.selectedAddOns.length > 0 ? item.selectedAddOns : undefined,
          })),
        },
      },
      include: { items: true, editHistory: { orderBy: { editedAt: "desc" } } },
    });

    return updated;
  });
}
