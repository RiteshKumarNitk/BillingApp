"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";

// Table management (QR ordering) is gated the same way as the Website Builder — store-owner only
// — rather than a new granular permission, since new Role.permissions values aren't backfilled to
// existing tenants' roles (see lib/permissions.client.ts).
async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    throw new Error("Forbidden - only the store owner can manage tables");
  }
  return session;
}

export async function getTables() {
  const session = await requireOwner();
  return prisma.table.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { label: "asc" },
  });
}

export async function createTable(label: string) {
  const session = await requireOwner();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Table label is required");

  const table = await prisma.table.create({
    data: { tenantId: session.user.tenantId, label: trimmed },
  });

  revalidatePath("/tables");
  return table;
}

export async function updateTable(tableId: string, data: { label?: string; isActive?: boolean }) {
  const session = await requireOwner();

  const updateData: any = {};
  if (data.label !== undefined) {
    const trimmed = data.label.trim();
    if (!trimmed) throw new Error("Table label is required");
    updateData.label = trimmed;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const table = await prisma.table.update({
    where: { id: tableId, tenantId: session.user.tenantId },
    data: updateData,
  });

  revalidatePath("/tables");
  return table;
}

export async function deleteTable(tableId: string) {
  const session = await requireOwner();

  await prisma.table.delete({
    where: { id: tableId, tenantId: session.user.tenantId },
  });

  revalidatePath("/tables");
}
