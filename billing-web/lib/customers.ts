import prisma from "@/lib/prisma";
import { isValidPhone, normalizePhone } from "@/lib/utils/phone";

// Server-only data helpers that take a trusted `tenantId` from their caller (a server component
// or service that already resolved it from the session). These deliberately do NOT live in
// lib/actions/customers.ts: that file is "use server", which turns every export into a
// network-callable server action — and with a caller-supplied tenantId and no session check, any
// visitor could read/create another tenant's customers. Never re-export these from a
// "use server" module.

// Every completed sale must be linked to a real customer, keyed on phone (the one identifier a
// cashier can always ask for). Mirrors the find-or-create pattern already proven in
// lib/orders/createCustomerOrder.ts's findOrCreateCustomer (mobile/QR ordering) — same shape,
// adapted to POS's {tenantId, phone} uniqueness instead of {tenantId, customerAccountId}.
export async function findOrCreateCustomerByPhone(tenantId: string, phone: string, name?: string | null) {
  if (!isValidPhone(phone)) {
    throw new Error("A valid 10-digit customer mobile number is required");
  }
  const normalized = normalizePhone(phone);

  const existing = await prisma.customer.findFirst({ where: { tenantId, phone: normalized } });
  if (existing) return existing;

  try {
    return await prisma.customer.create({
      data: { tenantId, phone: normalized, name: name?.trim() || "Customer" },
    });
  } catch (err) {
    // Two concurrent first-time sales for the same phone both missed the lookup above; the
    // @@unique([tenantId, phone]) constraint lets exactly one create win — return that row
    // instead of failing the second sale.
    if ((err as { code?: string } | null)?.code === "P2002") {
      const winner = await prisma.customer.findFirst({ where: { tenantId, phone: normalized } });
      if (winner) return winner;
    }
    throw err;
  }
}

export interface ListCustomersParams {
  tenantId: string;
  search?: string;
  page?: number;
  pageSize?: number;
  // "New this month" from the dashboard's Customers card — filters by when the customer record
  // itself was created, not their most recent purchase.
  createdFrom?: string;
}

// Reuses the same `contains` search-by-name-or-phone pattern already established in the mobile
// customers API (app/api/mobile/customers/route.ts) rather than inventing a new search shape.
export async function listCustomers({ tenantId, search, page = 1, pageSize = 25, createdFrom }: ListCustomersParams) {
  const where = {
    tenantId,
    ...(search?.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" as const } },
            { phone: { contains: search.trim() } },
          ],
        }
      : {}),
    ...(createdFrom ? { createdDate: { gte: new Date(createdFrom) } } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { totalSpent: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, pageSize };
}

export async function getCustomerDetail(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
  if (!customer) return null;

  const transactions = await prisma.transaction.findMany({
    where: { customerId, tenantId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, netAmount: true, createdAt: true, paymentMethod: true, items: { select: { name: true, quantity: true } } },
  });

  return { customer, transactions };
}
