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

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: any = { customerAccountId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.notification.count({ where: { customerAccountId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customerAccountId = verifyToken(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { customerAccountId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, customerAccountId },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Notifications marked as read" });
    }

    return NextResponse.json({ error: "Provide notificationIds or markAll" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
