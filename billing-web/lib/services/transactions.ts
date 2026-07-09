import prisma from "@/lib/prisma";
import { checkFeatureLimit } from "@/lib/subscription";

export class TransactionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface CreateTransactionItemInput {
  productId: string;
  quantity: number | string;
  salePrice: number | string;
  variantId?: string | null;
  batchId?: string | null;
  serialId?: string | null;
  titleOverride?: string;
  name?: string;
  purchasePrice?: number | string;
  mrp?: number | string;
  productType?: string;
  barcode?: string;
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
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
}

function parseOptionalAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createTransaction(params: CreateTransactionParams) {
  const {
    tenantId, userId, role, permissions,
    items, discount = 0, taxAmount = 0,
    paymentMethod, amountReceived, changeAmount,
    customerId, customerName, customerPhone, notes
  } = params;

  if (role !== "SUPERADMIN" && !permissions.includes("CREATE_BILL")) {
    throw new TransactionError("Forbidden: Requires CREATE_BILL permission", 403);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new TransactionError("Items are required and must be a non-empty array", 400);
  }

  const limitCheck = await checkFeatureLimit(tenantId, "transactions");
  if (!limitCheck.allowed) {
    throw new TransactionError(limitCheck.reason || "Transaction limit reached", 403);
  }

  const normalizedItems = items.map((item) => {
    const quantity = parseFloat(String(item.quantity));
    const salePrice = parseFloat(String(item.salePrice));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TransactionError(`Invalid quantity for item ${item.productId}`, 400);
    }
    if (!Number.isFinite(salePrice) || salePrice < 0) {
      throw new TransactionError(`Invalid sale price for item ${item.productId}`, 400);
    }

    const purchasePrice = parseFloat(String(item.purchasePrice ?? 0)) || 0;
    const mrp = parseFloat(String(item.mrp ?? 0)) || 0;

    return {
      productId: item.productId,
      name: item.titleOverride || item.name || "Product",
      barcode: item.barcode || "",
      purchasePrice,
      mrp,
      salePrice,
      quantity,
      itemTotal: quantity * salePrice,
      variantId: item.variantId || null,
      batchId: item.batchId || null,
      serialId: item.serialId || null,
      productType: item.productType,
    };
  });

  const uniqueProductIds = Array.from(new Set(normalizedItems.map((i) => i.productId)));
  const ownedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, tenantId },
    select: { id: true },
  });
  if (ownedProducts.length !== uniqueProductIds.length) {
    throw new TransactionError("Unauthorized: One or more products do not belong to your tenant", 403);
  }

  const totalAmount = normalizedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const discountValue = parseFloat(String(discount)) || 0;
  const taxValue = parseFloat(String(taxAmount)) || 0;
  const discountAmount = (totalAmount * discountValue) / 100;
  const netAmount = Math.max(0, totalAmount - discountAmount + taxValue);

  const parsedAmountReceived = parseOptionalAmount(amountReceived);
  const parsedChangeAmount = parseOptionalAmount(changeAmount);

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        tenantId,
        userId,
        totalAmount,
        discount: discountValue,
        taxAmount: taxValue,
        netAmount,
        status: "COMPLETED",
        paymentMethod: paymentMethod || null,
        amountReceived: parsedAmountReceived,
        changeAmount: parsedChangeAmount,
        customerId: customerId || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        notes: notes || null,
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
            variantId: item.variantId,
            batchId: item.batchId,
            serialId: item.serialId,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of normalizedItems) {
      if (item.productType === "VARIANT" && item.variantId) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
        }
      } else if (item.productType === "BATCH" && item.batchId) {
        const result = await tx.productBatch.updateMany({
          where: { id: item.batchId, productId: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
        }
      } else if (item.productType === "SERIAL" && item.serialId) {
        const result = await tx.productSerial.updateMany({
          where: { id: item.serialId, productId: item.productId, status: "AVAILABLE" },
          data: { status: "SOLD" },
        });
        if (result.count === 0) {
          throw new TransactionError(`Serial item unavailable for ${item.name}`, 409);
        }
      } else if (item.productType !== "SERVICE") {
        // SIMPLE / WEIGHT / unspecified -> decrement base product stock
        const result = await tx.product.updateMany({
          where: { id: item.productId, tenantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new TransactionError(`Insufficient stock for ${item.name}`, 409);
        }
      }
    }

    return created;
  });

  return transaction;
}
