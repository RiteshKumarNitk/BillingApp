"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenseCategories";
import { runAction, UserError, type ActionResult } from "@/lib/actionResult";

// Expenses are the business's private ledger and feed net profit, so every action requires
// VIEW_PROFIT (Owner + Manager by default — not Cashier). The tenant always comes from the
// session, never from an argument (this is a "use server" file: every export is network-callable).
// Mutations return ActionResult so validation messages survive production error masking.
async function requireExpenseAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || session.user.role === "CUSTOMER") throw new UserError("Please sign in again.");
  if (!(await hasPermission("VIEW_PROFIT"))) throw new UserError("You don't have permission to manage expenses.");
  return session.user.tenantId;
}

const MAX_AMOUNT = 100_000_000;

export interface ExpenseInput {
  name: string;
  category: string;
  amount: number | string;
  date?: string;
  notes?: string;
}

function validate(input: ExpenseInput) {
  const name = String(input.name || "").trim();
  if (!name) throw new UserError("Description is required");
  if (name.length > 120) throw new UserError("Description must be 120 characters or fewer");
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(input.category) ? (input.category as ExpenseCategory) : "OTHER";
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) throw new UserError("Amount must be greater than zero");
  if (amount > MAX_AMOUNT) throw new UserError("Amount is too large");
  // A date-only value ("2026-10-01") is stored at 12:00 UTC: midnight UTC would fall on the
  // previous calendar day for tenants west of UTC and land in the wrong month's P&L.
  const date = !input.date
    ? new Date()
    : /^\d{4}-\d{2}-\d{2}$/.test(input.date)
      ? new Date(`${input.date}T12:00:00Z`)
      : new Date(input.date);
  if (Number.isNaN(date.getTime())) throw new UserError("Invalid date");
  const notes = input.notes?.trim() ? input.notes.trim().slice(0, 500) : null;
  return { name, category, amount, date, notes };
}

// Read model for the server-rendered Expenses page (throws; not called from the browser).
export async function listExpenses(range: { from: string; to: string }) {
  const tenantId = await requireExpenseAccess();
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new Error("Invalid date range");

  const where = { tenantId, date: { gte: from, lt: to } };
  const [expenses, byCategory] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { date: "desc" }, take: 500 }),
    prisma.expense.groupBy({ by: ["category"], where, _sum: { amount: true } }),
  ]);
  return {
    expenses,
    byCategory: byCategory.map((c) => ({ category: c.category, total: c._sum.amount || 0 })),
    total: byCategory.reduce((sum, c) => sum + (c._sum.amount || 0), 0),
  };
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult<{ id: string }>> {
  return runAction("createExpense", async () => {
    const tenantId = await requireExpenseAccess();
    const data = validate(input);
    const expense = await prisma.expense.create({ data: { ...data, tenantId } });
    revalidatePath("/expenses");
    revalidatePath("/reports");
    return { id: expense.id };
  });
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  return runAction("deleteExpense", async () => {
    const tenantId = await requireExpenseAccess();
    const result = await prisma.expense.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new UserError("Expense not found");
    revalidatePath("/expenses");
    revalidatePath("/reports");
  });
}
