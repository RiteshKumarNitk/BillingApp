import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "billing-app-secret-key";

function verifyToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "CUSTOMER") return null;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: customerAccountId },
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        _count: { select: { orderRequests: true } },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const loyaltyResult = await prisma.customer.aggregate({
      where: { customerAccountId },
      _sum: { loyaltyPoints: true, totalSpent: true },
    });

    return NextResponse.json({
      profile: {
        ...account,
        loyaltyPoints: loyaltyResult._sum.loyaltyPoints || 0,
        totalSpent: loyaltyResult._sum.totalSpent || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await request.json();

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const account = await prisma.customerAccount.findUnique({ where: { id: customerAccountId } });
      if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      const isValid = await bcrypt.compare(currentPassword, account.password);
      if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.customerAccount.update({ where: { id: customerAccountId }, data: { password: hashedPassword } });
    }

    const updated = await prisma.customerAccount.update({
      where: { id: customerAccountId },
      data: { name: name?.trim() || undefined, phone: phone?.trim() || null },
      select: { id: true, name: true, email: true, phone: true },
    });

    await prisma.customer.updateMany({
      where: { customerAccountId },
      data: { name: name?.trim() || undefined, phone: phone?.trim() || null },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
