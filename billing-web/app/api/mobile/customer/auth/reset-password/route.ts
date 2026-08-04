import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }

    // A 6-digit code is a 1-in-a-million guess — throttle both by IP (stop a single attacker
    // hammering many accounts) and by the target email (stop distributed guessing against one
    // account), so neither axis alone gives an attacker a free brute-force budget.
    const ip = getClientIp(request);
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!checkRateLimit(`reset-password-ip:${ip}`, 20, 15 * 60 * 1000) ||
        !checkRateLimit(`reset-password-email:${normalizedEmail}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
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
