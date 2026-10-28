"use server";

import { serverAction, UserError } from "@/lib/actionResult";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const DEFAULT_UNITS = ["PIECE", "KG", "GRAM", "LITRE", "ML", "BOX", "PACK", "DOZEN"];

export async function getUnits() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  const tenantId = session.user.tenantId;
  let units = await prisma.unit.findMany({ where: { tenantId }, orderBy: { name: "asc" } });

  // Every tenant starts with a sensible default list they can rename/extend/delete — seeded
  // lazily here (rather than only at tenant creation) so tenants that existed before this
  // feature shipped aren't left with an empty dropdown.
  if (units.length === 0) {
    await prisma.unit.createMany({
      data: DEFAULT_UNITS.map((name) => ({ tenantId, name })),
      skipDuplicates: true,
    });
    units = await prisma.unit.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }

  return units;
}

async function createUnitImpl(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new UserError("Unit name is required");

  const unit = await prisma.unit.create({
    data: { name: trimmed, tenantId: session.user.tenantId },
  });

  revalidatePath("/products/units");
  revalidatePath("/products/add");
  return unit;
}

async function updateUnitImpl(unitId: string, name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new UserError("Unit name is required");

  const unit = await prisma.unit.update({
    where: { id: unitId, tenantId: session.user.tenantId },
    data: { name: trimmed },
  });

  revalidatePath("/products/units");
  return unit;
}

async function deleteUnitImpl(unitId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UserError("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const tenantId = session.user.tenantId;
  const unit = await prisma.unit.findUnique({ where: { id: unitId, tenantId } });
  if (!unit) throw new UserError("Unit not found");

  await prisma.unit.delete({ where: { id: unitId } });

  revalidatePath("/products/units");
  revalidatePath("/products/add");

  // Informational only — Product.unit is a plain string, not a foreign key, so existing
  // products keep whatever unit text they already have. This just tells the caller how many
  // products currently use the deleted unit's name, in case they want to know.
  const productsUsingIt = await prisma.product.count({ where: { tenantId, unit: unit.name } });
  return { productsUsingIt };
}

// Mutations return ActionResult so validation messages survive production error masking
// (client callers read them with unwrap()). See lib/actionResult.ts.
export const createUnit = serverAction("createUnit", createUnitImpl);
export const updateUnit = serverAction("updateUnit", updateUnitImpl);
export const deleteUnit = serverAction("deleteUnit", deleteUnitImpl);
