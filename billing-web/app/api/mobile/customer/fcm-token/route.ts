import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "billing-app-secret-key";

function verifyToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "CUSTOMER") return null;
    return decoded.id;
  } catch {
    return null;
  }
}

// POST: Register or update FCM token
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcmToken } = await request.json();
    if (!fcmToken) {
      return NextResponse.json({ error: "fcmToken is required" }, { status: 400 });
    }

    await prisma.customerAccount.update({
      where: { id: customerAccountId },
      data: { fcmToken },
    });

    return NextResponse.json({ message: "FCM token saved" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove FCM token (on logout)
export async function DELETE(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.customerAccount.update({
      where: { id: customerAccountId },
      data: { fcmToken: null },
    });

    return NextResponse.json({ message: "FCM token removed" });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
