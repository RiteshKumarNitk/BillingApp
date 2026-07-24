import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

// Bumps tokenVersion, which invalidates every previously-issued token for this account (not just
// the one making this request) — a real "log out everywhere," not just an on-device token clear.
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.customerAccount.update({
      where: { id: customerAccountId },
      data: { tokenVersion: { increment: 1 }, fcmToken: null },
    });

    return NextResponse.json({ message: "Logged out" });
  } catch (error) {
    console.error("Customer logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
