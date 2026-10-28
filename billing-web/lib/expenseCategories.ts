// Shared by the expenses actions (validation), the Expenses page, the P&L report and CSV export.
// Kept out of the "use server" actions file, which may only export async functions.
export const EXPENSE_CATEGORIES = ["RENT", "SALARIES", "UTILITIES", "SUPPLIES", "MAINTENANCE", "MARKETING", "OTHER"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Rent",
  SALARIES: "Salaries & wages",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies & ingredients",
  MAINTENANCE: "Maintenance & repairs",
  MARKETING: "Marketing",
  OTHER: "Other",
};

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
}
