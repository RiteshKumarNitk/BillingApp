import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.customerAccount.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await prisma.customerAccount.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: { id: account.id, name: account.name, email: account.email },
    }, { status: 201 });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
