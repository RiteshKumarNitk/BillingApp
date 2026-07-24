import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (
      !account ||
      !account.resetToken ||
      account.resetToken !== code ||
      !account.resetTokenExpiry ||
      account.resetTokenExpiry < new Date()
    ) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.customerAccount.update({
      where: { id: account.id },
      // Bumping tokenVersion forces re-login on every device after a reset.
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null, tokenVersion: { increment: 1 } },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
