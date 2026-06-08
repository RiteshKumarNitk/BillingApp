import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  });
}
