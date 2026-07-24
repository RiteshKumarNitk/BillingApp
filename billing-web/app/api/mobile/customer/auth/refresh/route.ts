import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader, signCustomerToken } from "@/lib/auth/customer-mobile";

// Sliding-session refresh: given a still-valid (unexpired, unrevoked) bearer token, issues a new
// 30-day token. Not refresh-token rotation (no separate long-lived refresh-token type/storage) —
// the app calls this opportunistically (on resume, or once on a 401) to keep an active session
// alive past its current token's expiry without forcing a re-login.
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.customerAccount.findUnique({ where: { id: customerAccountId } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const token = signCustomerToken({
      id: account.id,
      email: account.email,
      role: "CUSTOMER",
      tokenVersion: account.tokenVersion,
    });

    return NextResponse.json({
      token,
      user: { id: account.id, name: account.name, email: account.email, phone: account.phone },
    });
  } catch (error) {
    console.error("Customer token refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
