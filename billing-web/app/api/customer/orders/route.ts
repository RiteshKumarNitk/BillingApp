import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";

// POST: Submit a new order request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, items, notes } = await request.json();

    if (!tenantId || !items || items.length === 0) {
      return NextResponse.json({ error: "Tenant and items are required" }, { status: 400 });
    }

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
    }

    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true }
      });

      if (!product) continue;

      let salePrice = product.salePrice;
      let itemName = product.name;
      let barcode = product.barcode || "";

      // Check if it's a variant
      if (item.variantId) {
        const variant = product.variants.find((v: any) => v.id === item.variantId);
        if (variant) {
          salePrice = variant.salePrice;
          itemName = `${product.name} - ${variant.name}`;
          barcode = variant.barcode || barcode;
        }
      }

      const itemTotal = salePrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        name: itemName,
        barcode,
        salePrice,
        quantity: item.quantity,
        itemTotal,
      });
    }

    // Get shop tax rate
    const shop = await prisma.shop.findUnique({ where: { tenantId } });
    const taxRate = shop?.defaultTaxRate || 0;
    taxAmount = totalAmount * (taxRate / 100);
    const netAmount = totalAmount + taxAmount;

    // Find or create customer record for this tenant
    let customer = await prisma.customer.findFirst({
      where: { tenantId, customerAccountId: session.user.id }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: session.user.name || "Customer",
          email: session.user.email,
          phone: null,
          tenantId,
          customerAccountId: session.user.id,
        }
      });
    }

    // Create the order request
    const orderRequest = await prisma.orderRequest.create({
      data: {
        status: "PENDING",
        notes: notes || null,
        totalAmount,
        taxAmount,
        netAmount,
        tenantId,
        customerAccountId: session.user.id,
        customerId: customer.id,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      message: "Order submitted successfully",
      order: orderRequest,
    }, { status: 201 });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: List customer's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.orderRequest.findMany({
      where: { customerAccountId: session.user.id },
      include: {
        items: true,
        tenant: { select: { name: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
