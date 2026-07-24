import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { customerAccountId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { label, fullAddress, landmark, city, state, postalCode, latitude, longitude, isDefault } =
      await request.json();

    if (!fullAddress?.trim()) {
      return NextResponse.json({ error: "Full address is required" }, { status: 400 });
    }

    const existingCount = await prisma.customerAddress.count({ where: { customerAccountId } });
    const shouldBeDefault = isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.customerAddress.updateMany({ where: { customerAccountId, isDefault: true }, data: { isDefault: false } });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerAccountId,
        label: label?.trim() || null,
        fullAddress: fullAddress.trim(),
        landmark: landmark?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        postalCode: postalCode?.trim() || null,
        latitude: typeof latitude === "number" ? latitude : null,
        longitude: typeof longitude === "number" ? longitude : null,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
