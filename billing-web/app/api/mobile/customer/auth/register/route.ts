import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signCustomerToken } from "@/lib/auth/customer-mobile";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// S1: unauthenticated account-creation spam guard. 10 registrations / hour per IP.
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`customer-register:${getClientIp(request)}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many sign-up attempts from this device. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.customerAccount.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await prisma.customerAccount.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone?.trim() || null,
      },
    });

    // No email-verification step exists, so registration logs the customer in immediately —
    // matches the login response shape so the client can reuse the same auth-handling code path.
    const token = signCustomerToken({
      id: account.id,
      email: account.email,
      role: "CUSTOMER",
      tokenVersion: account.tokenVersion,
    });

    return NextResponse.json({
      message: "Account created successfully",
      token,
      user: { id: account.id, name: account.name, email: account.email, phone: account.phone },
    }, { status: 201 });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
