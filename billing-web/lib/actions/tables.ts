"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { revalidatePath } from "next/cache";
import { checkFeatureLimit } from "@/lib/subscription";

// Table management (QR ordering) is gated the same way as the Website Builder — store-owner only
// — rather than a new granular permission, since new Role.permissions values aren't backfilled to
// existing tenants' roles (see lib/permissions.client.ts).
async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    throw new UserError("Forbidden - only the store owner can manage tables");
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

async function createTableImpl(label: string) {
  const session = await requireOwner();
  const trimmed = label.trim();
  if (!trimmed) throw new UserError("Table label is required");

  const limitCheck = await checkFeatureLimit(session.user.tenantId, "tables");
  if (!limitCheck.allowed) {
    throw new UserError(limitCheck.reason);
  }

  const table = await prisma.table.create({
    data: { tenantId: session.user.tenantId, label: trimmed },
  });

  revalidatePath("/tables");
  return table;
}

async function updateTableImpl(tableId: string, data: { label?: string; isActive?: boolean }) {
  const session = await requireOwner();

  const updateData: any = {};
  if (data.label !== undefined) {
    const trimmed = data.label.trim();
    if (!trimmed) throw new UserError("Table label is required");
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

async function deleteTableImpl(tableId: string) {
  const session = await requireOwner();

  await prisma.table.delete({
    where: { id: tableId, tenantId: session.user.tenantId },
  });

  revalidatePath("/tables");
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const createTable = serverAction("createTable", createTableImpl);
export const updateTable = serverAction("updateTable", updateTableImpl);
export const deleteTable = serverAction("deleteTable", deleteTableImpl);
