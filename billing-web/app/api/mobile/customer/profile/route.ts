import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader, signCustomerToken } from "@/lib/auth/customer-mobile";

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
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
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await request.json();
    let newToken: string | null = null;

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
      // Bumping tokenVersion revokes every token issued before this change (a stolen token must
      // not outlive the old password); this device gets a fresh token in the response below.
      const rotated = await prisma.customerAccount.update({
        where: { id: customerAccountId },
        data: { password: hashedPassword, tokenVersion: { increment: 1 } },
        select: { id: true, email: true, tokenVersion: true },
      });
      newToken = signCustomerToken({ id: rotated.id, email: rotated.email, role: "CUSTOMER", tokenVersion: rotated.tokenVersion });
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

    return NextResponse.json({ profile: updated, ...(newToken ? { token: newToken } : {}) });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
