import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signCustomerToken } from "@/lib/auth/customer-mobile";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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
