import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/website/utils';

export interface CreateCustomerOrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  // ProductAddOn ids selected for this line (e.g. "Extra Shot") — validated against the product's
  // own add-ons, then folded into salePrice/name the same way a variant selection already is, so
  // an order snapshot always reflects exactly what was charged.
  addOnIds?: string[];
}

export interface CreateCustomerOrderInput {
  tenantIdOrSlug: string;
  items: CreateCustomerOrderItemInput[];
  notes?: string;
  // QR table ordering: a scanned table QR carries a token, re-validated here (not trusted from the
  // client beyond the token itself) against the resolved tenant's own tables. orderType is fully
  // derived, never client-supplied: a valid table forces DINE_IN, otherwise TAKE_AWAY. DELIVERY
  // isn't offered — there's no address-book model yet.
  tableToken?: string;
  // Exactly one of these identifies who the order is for.
  customerAccountId?: string;
  guest?: { name: string; phone: string };
  // Client-generated per-checkout-attempt key (e.g. a UUID minted once when the checkout screen
  // loads, reused across retries of the same attempt). A repeat with the same key for the same
  // customer returns the original order instead of creating a duplicate — covers double-taps and
  // network-retry races that the client's own submit-button guard doesn't. Only meaningful for
  // logged-in orders (guest checkout has no stable identity to key off).
  idempotencyKey?: string;
}

type OrderRequestWithItems = Awaited<ReturnType<typeof createOrderRequest>>;

export type CreateCustomerOrderResult =
  | { ok: true; order: OrderRequestWithItems }
  | { ok: false; status: number; error: string };

// Shared by the cookie-based website checkout (app/api/customer/orders) and the bearer-JWT mobile
// checkout (app/api/mobile/customer/orders) so QR/table ordering, slug-based tenant addressing,
// combo-content snapshotting, and discount application only exist in one place instead of two
// independently-drifting copies.
export async function createCustomerOrder(input: CreateCustomerOrderInput): Promise<CreateCustomerOrderResult> {
  const { tenantIdOrSlug, items, notes, tableToken, customerAccountId, guest, idempotencyKey } = input;

  if (!tenantIdOrSlug || !items || items.length === 0) {
    return { ok: false, status: 400, error: 'Tenant and items are required' };
  }
  if (!customerAccountId && (!guest?.name?.trim() || !guest?.phone?.trim())) {
    return { ok: false, status: 401, error: 'Sign in or provide your name and phone to order' };
  }

  if (customerAccountId && idempotencyKey) {
    const existingOrder = await prisma.orderRequest.findUnique({
      where: { customerAccountId_idempotencyKey: { customerAccountId, idempotencyKey } },
      include: { items: true },
    });
    if (existingOrder) return { ok: true, order: existingOrder };
  }

  const tenant = await resolveTenant(tenantIdOrSlug);
  if (!tenant || tenant.status !== 'ACTIVE') {
    return { ok: false, status: 404, error: 'Store not found or inactive' };
  }
  const tenantId = tenant.id;

  let tableId: string | null = null;
  if (tableToken) {
    const table = await prisma.table.findUnique({ where: { qrToken: tableToken } });
    if (table && table.tenantId === tenantId && table.isActive) {
      tableId = table.id;
    }
  }
  const orderType = tableId ? 'DINE_IN' : 'TAKE_AWAY';

  let totalAmount = 0;
  const orderItems: {
    productId: string;
    name: string;
    barcode: string;
    salePrice: number;
    quantity: number;
    itemTotal: number;
    comboComponents?: { name: string; variantName: string | null; quantity: number }[];
  }[] = [];
  // Category subtotals/quantities across the whole cart, for matching Discount.applicableCategory.
  const categorySubtotals = new Map<string, number>();
  const categoryQuantities = new Map<string, number>();

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId },
      include: {
        variants: true,
        addOns: true,
        comboComponents: {
          include: {
            component: { select: { name: true } },
            componentVariant: { select: { name: true } },
          },
        },
      },
    });
    if (!product) continue;

    let salePrice = product.salePrice;
    let itemName = product.name;
    let barcode = product.barcode || '';

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        salePrice = variant.salePrice;
        itemName = `${product.name} - ${variant.name}`;
        barcode = variant.barcode || barcode;
      }
    }

    if (item.addOnIds && item.addOnIds.length > 0) {
      const selectedAddOns = product.addOns.filter((a) => item.addOnIds!.includes(a.id));
      for (const addOn of selectedAddOns) {
        salePrice += addOn.price;
      }
      if (selectedAddOns.length > 0) {
        itemName = `${itemName} + ${selectedAddOns.map((a) => a.name).join(', ')}`;
      }
    }

    const itemTotal = salePrice * item.quantity;
    totalAmount += itemTotal;

    const category = product.category || 'Other';
    categorySubtotals.set(category, (categorySubtotals.get(category) || 0) + itemTotal);
    categoryQuantities.set(category, (categoryQuantities.get(category) || 0) + item.quantity);

    const comboComponents = product.productType === 'COMBO'
      ? product.comboComponents.map((c) => ({
          name: c.component.name,
          variantName: c.componentVariant?.name ?? null,
          quantity: c.quantity,
        }))
      : undefined;

    orderItems.push({
      productId: product.id,
      name: itemName,
      barcode,
      salePrice,
      quantity: item.quantity,
      itemTotal,
      ...(comboComponents && comboComponents.length > 0 ? { comboComponents } : {}),
    });
  }

  if (orderItems.length === 0) {
    return { ok: false, status: 400, error: 'No valid items in order' };
  }

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const { amount: discountAmount, label: discountLabel } = await pickBestDiscount(
    tenantId,
    totalAmount,
    totalQuantity,
    categorySubtotals,
    categoryQuantities,
  );

  const taxableAmount = totalAmount - discountAmount;
  const shop = await prisma.shop.findUnique({ where: { tenantId } });
  const taxRate = shop?.defaultTaxRate || 0;
  const taxAmount = taxableAmount * (taxRate / 100);
  const netAmount = taxableAmount + taxAmount;

  const customer = await findOrCreateCustomer(tenantId, customerAccountId, guest);

  let order: OrderRequestWithItems;
  try {
    order = await createOrderRequest({
      tenantId,
      customerAccountId: customerAccountId || null,
      customerId: customer.id,
      guestName: customerAccountId ? null : guest!.name.trim(),
      guestPhone: customerAccountId ? null : guest!.phone.trim(),
      tableId,
      orderType,
      notes: notes || null,
      totalAmount,
      taxAmount,
      netAmount,
      discountAmount,
      discountLabel,
      idempotencyKey: customerAccountId ? idempotencyKey || null : null,
      orderItems,
    });
  } catch (err: any) {
    // Two concurrent requests both passed the pre-check above and raced on the DB's unique
    // constraint — the loser here just means the winner already created the real order.
    if (err?.code === 'P2011' || err?.code === 'P2002') {
      if (customerAccountId && idempotencyKey) {
        const existingOrder = await prisma.orderRequest.findUnique({
          where: { customerAccountId_idempotencyKey: { customerAccountId, idempotencyKey } },
          include: { items: true },
        });
        if (existingOrder) return { ok: true, order: existingOrder };
      }
    }
    throw err;
  }

  return { ok: true, order };
}

// Best single non-coupon Discount (code: null — a customer-entered coupon flow doesn't exist yet)
// whose category+minimumQuantity conditions the cart satisfies. Non-stacking: picks whichever
// eligible discount yields the largest amount, rather than combining several.
async function pickBestDiscount(
  tenantId: string,
  totalAmount: number,
  totalQuantity: number,
  categorySubtotals: Map<string, number>,
  categoryQuantities: Map<string, number>,
): Promise<{ amount: number; label: string | null }> {
  const now = new Date();
  const discounts = await prisma.discount.findMany({ where: { tenantId, isActive: true, code: null } });

  let bestAmount = 0;
  let bestLabel: string | null = null;
  for (const d of discounts) {
    if (d.startDate && d.startDate > now) continue;
    if (d.endDate && d.endDate < now) continue;

    const matchSubtotal = d.applicableCategory ? (categorySubtotals.get(d.applicableCategory) || 0) : totalAmount;
    const matchQuantity = d.applicableCategory ? (categoryQuantities.get(d.applicableCategory) || 0) : totalQuantity;
    if (matchQuantity < d.minimumQuantity || matchSubtotal <= 0) continue;

    const candidateAmount = matchSubtotal * (d.discountPercentage / 100);
    if (candidateAmount > bestAmount) {
      bestAmount = candidateAmount;
      bestLabel = d.name;
    }
  }
  return { amount: bestAmount, label: bestLabel };
}

// Finds-or-creates the per-tenant CRM Customer row — for a logged-in customer, keyed to their
// account; for a guest, keyed to their phone number so a repeat guest at the same cafe still
// accumulates one CRM history instead of a fresh row every order.
async function findOrCreateCustomer(
  tenantId: string,
  customerAccountId: string | undefined,
  guest: { name: string; phone: string } | undefined,
) {
  const existing = customerAccountId
    ? await prisma.customer.findFirst({ where: { tenantId, customerAccountId } })
    : await prisma.customer.findFirst({ where: { tenantId, phone: guest!.phone.trim(), customerAccountId: null } });
  if (existing) return existing;

  if (customerAccountId) {
    const account = await prisma.customerAccount.findUnique({ where: { id: customerAccountId } });
    return prisma.customer.create({
      data: { name: account?.name || 'Customer', email: account?.email, phone: account?.phone, tenantId, customerAccountId },
    });
  }
  return prisma.customer.create({
    data: { name: guest!.name.trim(), phone: guest!.phone.trim(), tenantId },
  });
}

function createOrderRequest(data: {
  tenantId: string;
  customerAccountId: string | null;
  customerId: string;
  guestName: string | null;
  guestPhone: string | null;
  tableId: string | null;
  orderType: string | null;
  notes: string | null;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  discountAmount: number;
  discountLabel: string | null;
  idempotencyKey: string | null;
  orderItems: {
    productId: string;
    name: string;
    barcode: string;
    salePrice: number;
    quantity: number;
    itemTotal: number;
    comboComponents?: { name: string; variantName: string | null; quantity: number }[];
  }[];
}) {
  return prisma.orderRequest.create({
    data: {
      status: 'PENDING',
      notes: data.notes,
      totalAmount: data.totalAmount,
      taxAmount: data.taxAmount,
      netAmount: data.netAmount,
      discountAmount: data.discountAmount,
      discountLabel: data.discountLabel,
      tenantId: data.tenantId,
      customerAccountId: data.customerAccountId,
      customerId: data.customerId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      tableId: data.tableId,
      orderType: data.orderType,
      idempotencyKey: data.idempotencyKey,
      items: { create: data.orderItems },
    },
    include: { items: true },
  });
}
