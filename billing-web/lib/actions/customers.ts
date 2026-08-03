"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { isValidPhone, normalizePhone } from "@/lib/utils/phone";

export async function findCustomerByPhone(phone: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const customer = await prisma.customer.findFirst({
    where: { tenantId: session.user.tenantId, phone: trimmed },
    select: { id: true, name: true, phone: true, loyaltyPoints: true },
  });

  return customer;
}

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

  return prisma.customer.create({
    data: { tenantId, phone: normalized, name: name?.trim() || "Customer" },
  });
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

// Reuses the existing Cloudinary-backed /api/upload pipeline (via the shared ImageUpload
// component) rather than a new upload mechanism — this action only persists the resulting URL.
export async function updateCustomerPhoto(customerId: string, photoUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }
  const existing = await prisma.customer.findFirst({ where: { id: customerId, tenantId: session.user.tenantId } });
  if (!existing) {
    throw new Error("Customer not found");
  }
  await prisma.customer.update({ where: { id: customerId }, data: { photoUrl: photoUrl || null } });
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
