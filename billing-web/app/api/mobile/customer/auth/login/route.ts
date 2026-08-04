import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signCustomerToken } from "@/lib/auth/customer-mobile";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// S1: unauthenticated + previously unthrottled — brute-force guard. 10 attempts / 15 min per IP.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`customer-login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, account.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signCustomerToken({
      id: account.id,
      email: account.email,
      role: "CUSTOMER",
      tokenVersion: account.tokenVersion,
    });

    return NextResponse.json({
      token,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
