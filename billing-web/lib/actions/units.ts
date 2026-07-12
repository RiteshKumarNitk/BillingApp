"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const DEFAULT_UNITS = ["PIECE", "KG", "GRAM", "LITRE", "ML", "BOX", "PACK", "DOZEN"];

export async function getUnits() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

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

export async function createUnit(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new Error("Unit name is required");

  const unit = await prisma.unit.create({
    data: { name: trimmed, tenantId: session.user.tenantId },
  });

  revalidatePath("/products/units");
  revalidatePath("/products/add");
  return unit;
}

export async function updateUnit(unitId: string, name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new Error("Unit name is required");

  const unit = await prisma.unit.update({
    where: { id: unitId, tenantId: session.user.tenantId },
    data: { name: trimmed },
  });

  revalidatePath("/products/units");
  return unit;
}

export async function deleteUnit(unitId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  await requirePermission("EDIT_PRODUCT");

  const tenantId = session.user.tenantId;
  const unit = await prisma.unit.findUnique({ where: { id: unitId, tenantId } });
  if (!unit) throw new Error("Unit not found");

  await prisma.unit.delete({ where: { id: unitId } });

  revalidatePath("/products/units");
  revalidatePath("/products/add");

  // Informational only — Product.unit is a plain string, not a foreign key, so existing
  // products keep whatever unit text they already have. This just tells the caller how many
  // products currently use the deleted unit's name, in case they want to know.
  const productsUsingIt = await prisma.product.count({ where: { tenantId, unit: unit.name } });
  return { productsUsingIt };
}
