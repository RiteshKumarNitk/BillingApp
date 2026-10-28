"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { hasPermission } from "@/lib/permissions";
import { runAction, UserError, type ActionResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/publicCache";
import { getTenantTimeZone, zonedMidnightToUtc } from "@/lib/tenantTime";

// Discounts come in two kinds, distinguished only by `code`:
//   - coupon (code set):     a cashier types the code at the POS (lib/services/transactions.ts)
//   - automatic (code null): applied to online/QR orders and shown on the app menu
//                            (lib/orders/createCustomerOrder.ts, store-menu API)
// Same permission as the existing staff discounts API (EDIT_PRODUCT). Tenant always from session.
// Mutations return ActionResult (lib/actionResult.ts) so validation messages survive production
// error masking; listDiscounts is only called by the server-rendered page and may throw.
async function requireDiscountAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || session.user.role === "CUSTOMER") throw new UserError("Please sign in again.");
  if (!(await hasPermission("EDIT_PRODUCT"))) throw new UserError("You don't have permission to manage discounts.");
  return session.user.tenantId;
}

export interface DiscountInput {
  name: string;
  description?: string;
  code?: string | null;
  discountPercentage: number | string;
  applicableCategory?: string | null;
  minimumQuantity?: number | string;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

const CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

async function validate(tenantId: string, input: DiscountInput, excludeId?: string) {
  const name = String(input.name || "").trim();
  if (!name) throw new UserError("Name is required");
  if (name.length > 80) throw new UserError("Name must be 80 characters or fewer");

  const pct = Number(input.discountPercentage);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new UserError("Discount must be between 0.01% and 100%");

  const minimumQuantity = input.minimumQuantity === undefined || input.minimumQuantity === "" ? 1 : Math.floor(Number(input.minimumQuantity));
  if (!Number.isFinite(minimumQuantity) || minimumQuantity < 1 || minimumQuantity > 1000) throw new UserError("Minimum quantity must be between 1 and 1000");

  const code = input.code && String(input.code).trim() ? String(input.code).trim().toUpperCase() : null;
  if (code && !CODE_PATTERN.test(code)) throw new UserError("Coupon code: 3–30 letters, digits, - or _");
  if (code) {
    const clash = await prisma.discount.findFirst({
      where: { tenantId, code: { equals: code, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) throw new UserError(`Coupon code ${code} is already in use`);
  }

  // Date-only inputs are the cafe's own calendar days: a start date means "from the start of that
  // day", an end date "through the end of that day", both in the tenant's timezone (a UTC day would
  // run an "until Oct 31" offer into the morning of Nov 1 in India).
  const tz = await getTenantTimeZone(tenantId);
  const parseDate = (v: string | null | undefined, endOfDay: boolean) => {
    if (!v) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    const d = m
      ? endOfDay
        ? new Date(zonedMidnightToUtc(+m[1], +m[2], +m[3] + 1, tz).getTime() - 1)
        : zonedMidnightToUtc(+m[1], +m[2], +m[3], tz)
      : new Date(v);
    if (Number.isNaN(d.getTime())) throw new UserError("Invalid date");
    return d;
  };
  const startDate = parseDate(input.startDate, false);
  const endDate = parseDate(input.endDate, true);
  if (startDate && endDate && endDate < startDate) throw new UserError("End date must be after the start date");

  const applicableCategory = input.applicableCategory && String(input.applicableCategory).trim() ? String(input.applicableCategory).trim() : null;

  return {
    name,
    description: input.description?.trim() ? input.description.trim().slice(0, 300) : null,
    code,
    discountPercentage: Math.round(pct * 100) / 100,
    applicableCategory,
    minimumQuantity,
    startDate,
    endDate,
    isActive: input.isActive ?? true,
  };
}

function afterWrite() {
  // Automatic offers are shown on the public app menu, which is cached briefly.
  invalidatePublicCache();
  revalidatePath("/discounts");
}

export async function listDiscounts() {
  const tenantId = await requireDiscountAccess();
  const [discounts, categories] = await Promise.all([
    prisma.discount.findMany({ where: { tenantId }, orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    prisma.product.findMany({ where: { tenantId, category: { not: null } }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);
  return { discounts, categories: categories.map((c) => c.category as string) };
}

export async function createDiscount(input: DiscountInput): Promise<ActionResult<{ id: string }>> {
  return runAction("createDiscount", async () => {
    const tenantId = await requireDiscountAccess();
    const data = await validate(tenantId, input);
    try {
      const discount = await prisma.discount.create({ data: { ...data, tenantId } });
      afterWrite();
      return { id: discount.id };
    } catch (err) {
      if ((err as { code?: string } | null)?.code === "P2002") throw new UserError(`Coupon code ${data.code} is already in use`);
      throw err;
    }
  });
}

export async function updateDiscount(id: string, input: DiscountInput): Promise<ActionResult> {
  return runAction("updateDiscount", async () => {
    const tenantId = await requireDiscountAccess();
    const existing = await prisma.discount.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!existing) throw new UserError("Discount not found");
    const data = await validate(tenantId, input, id);
    try {
      await prisma.discount.update({ where: { id }, data });
      afterWrite();
    } catch (err) {
      if ((err as { code?: string } | null)?.code === "P2002") throw new UserError(`Coupon code ${data.code} is already in use`);
      throw err;
    }
  });
}

export async function setDiscountActive(id: string, isActive: boolean): Promise<ActionResult> {
  return runAction("setDiscountActive", async () => {
    const tenantId = await requireDiscountAccess();
    const result = await prisma.discount.updateMany({ where: { id, tenantId }, data: { isActive: !!isActive } });
    if (result.count === 0) throw new UserError("Discount not found");
    afterWrite();
  });
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  return runAction("deleteDiscount", async () => {
    const tenantId = await requireDiscountAccess();
    // Past sales store the coupon code and amount as text/numbers (no foreign key), so deleting a
    // discount never alters sales history.
    const result = await prisma.discount.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new UserError("Discount not found");
    afterWrite();
  });
}
