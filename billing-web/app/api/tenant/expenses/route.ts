import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// GET: List expenses for tenant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");

    const where: any = { tenantId: session.user.tenantId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    return NextResponse.json({ expenses, total });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, amount, date, notes } = await request.json();

    if (!name || !amount) {
      return NextResponse.json({ error: "Name and amount are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        name,
        category: category || "OTHER",
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.expense.deleteMany({
      where: { id, tenantId: session.user.tenantId },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
