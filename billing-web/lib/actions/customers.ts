"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

// Every export in this "use server" file is a network-callable server action, so each one must
// resolve the tenant from the session itself — never from an argument. Helpers that accept a
// trusted tenantId (listCustomers, getCustomerDetail, findOrCreateCustomerByPhone) live in
// lib/customers.ts instead.

export async function findCustomerByPhone(phone: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    throw new UserError("Unauthorized");
  }

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const customer = await prisma.customer.findFirst({
    where: { tenantId: session.user.tenantId, phone: trimmed },
    select: { id: true, name: true, phone: true, loyaltyPoints: true },
  });

  return customer;
}

// Reuses the existing Cloudinary-backed /api/upload pipeline (via the shared ImageUpload
// component) rather than a new upload mechanism — this action only persists the resulting URL.
async function updateCustomerPhotoImpl(customerId: string, photoUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    throw new UserError("Unauthorized");
  }
  const existing = await prisma.customer.findFirst({ where: { id: customerId, tenantId: session.user.tenantId } });
  if (!existing) {
    throw new UserError("Customer not found");
  }
  await prisma.customer.update({ where: { id: customerId }, data: { photoUrl: photoUrl || null } });
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const updateCustomerPhoto = serverAction("updateCustomerPhoto", updateCustomerPhotoImpl);
