import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail, EmailTemplates } from "@/lib/mail";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Always returns a generic success message regardless of whether the email exists, so this can't
// be used to enumerate registered accounts.
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (account) {
      // 6-digit numeric code — meant to be manually typed into the app, not a clickable link
      // (the mobile app has no deep-link handling for a reset URL).
      const code = crypto.randomInt(100000, 1000000).toString();
      await prisma.customerAccount.update({
        where: { id: account.id },
        data: { resetToken: code, resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });

      sendEmail({
        to: account.email,
        subject: "Reset your CafeOS password",
        html: EmailTemplates.CustomerPasswordReset(account.name, code),
      }).catch((err) => console.error("Failed to send password reset email:", err));
    }

    return NextResponse.json({ message: "If an account exists for that email, a reset code has been sent." });
  } catch (error) {
    console.error("Forgot-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
