import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

// POST: Register or update FCM token
export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
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
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
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
