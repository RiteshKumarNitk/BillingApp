import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: Get customer profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orderRequests: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get loyalty points across all tenants
    const loyaltyResult = await prisma.customer.aggregate({
      where: { customerAccountId: session.user.id },
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

// PUT: Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await request.json();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const account = await prisma.customerAccount.findUnique({
        where: { id: session.user.id },
      });

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, account.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.customerAccount.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });
    }

    // Update name and phone
    const updated = await prisma.customerAccount.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || undefined,
        phone: phone?.trim() || null,
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Also update all linked Customer records
    await prisma.customer.updateMany({
      where: { customerAccountId: session.user.id },
      data: {
        name: name?.trim() || undefined,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
