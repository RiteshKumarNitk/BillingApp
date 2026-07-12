"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

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
