import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "billing-app-secret-key";

export async function POST(request: NextRequest) {
  try {
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

    const token = jwt.sign(
      { id: account.id, email: account.email, role: "CUSTOMER" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

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
