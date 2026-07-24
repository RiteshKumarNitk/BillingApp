import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const existing = await prisma.customerAddress.findFirst({ where: { id, customerAccountId } });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const { label, fullAddress, landmark, city, state, postalCode, latitude, longitude, isDefault } =
      await request.json();

    if (fullAddress !== undefined && !fullAddress?.trim()) {
      return NextResponse.json({ error: "Full address cannot be empty" }, { status: 400 });
    }

    if (isDefault === true) {
      await prisma.customerAddress.updateMany({
        where: { customerAccountId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data: {
        label: label !== undefined ? label?.trim() || null : undefined,
        fullAddress: fullAddress !== undefined ? fullAddress.trim() : undefined,
        landmark: landmark !== undefined ? landmark?.trim() || null : undefined,
        city: city !== undefined ? city?.trim() || null : undefined,
        state: state !== undefined ? state?.trim() || null : undefined,
        postalCode: postalCode !== undefined ? postalCode?.trim() || null : undefined,
        latitude: latitude !== undefined ? (typeof latitude === "number" ? latitude : null) : undefined,
        longitude: longitude !== undefined ? (typeof longitude === "number" ? longitude : null) : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const existing = await prisma.customerAddress.findFirst({ where: { id, customerAccountId } });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.customerAddress.delete({ where: { id } });

    // If the deleted address was the default and other addresses remain, promote the most recent
    // one so there's always a sensible default after a delete (mirrors typical address-book UX).
    if (existing.isDefault) {
      const next = await prisma.customerAddress.findFirst({
        where: { customerAccountId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return NextResponse.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
