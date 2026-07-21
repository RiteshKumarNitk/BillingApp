import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/website/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// POST: Submit a new order request. Logged-in customers use their CustomerAccount session; guests
// (no account, per the CafeOS "Continue as Guest" checkout path) instead supply guestName/guestPhone
// directly in the body — this route is reachable without a session for that reason, so it's rate
// limited same as the other unauthenticated website-facing write endpoints.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isCustomerSession = !!session?.user?.id && session.user.role === "CUSTOMER";

    const { tenantId: tenantIdOrSlug, items, notes, tableToken, guestName, guestPhone } = await request.json();

    if (!isCustomerSession) {
      const ip = getClientIp(request);
      if (!checkRateLimit(`guest-order:${ip}`, 10, 10 * 60 * 1000)) {
        return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 });
      }
      if (!guestName?.trim() || !guestPhone?.trim()) {
        return NextResponse.json({ error: "Sign in or provide your name and phone to order" }, { status: 401 });
      }
    }

    if (!tenantIdOrSlug || !items || items.length === 0) {
      return NextResponse.json({ error: "Tenant and items are required" }, { status: 400 });
    }

    // The site is reachable at either /site/<uuid> or /site/<websiteSlug>, and CartContext's
    // tenantId prop is just whichever segment the customer's URL happened to use — resolve it the
    // same way the site pages do rather than assuming it's always the raw id.
    const tenant = await resolveTenant(tenantIdOrSlug);
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
    }
    const tenantId = tenant.id;

    // QR table ordering: a scanned table QR carries a token in the URL, threaded through to
    // checkout by CartContext. Re-validated here (not trusted from the client beyond the token
    // itself) against this tenant's own tables so a token can't be replayed against another tenant.
    let tableId: string | null = null;
    let orderType: string | null = null;
    if (tableToken) {
      const table = await prisma.table.findUnique({ where: { qrToken: tableToken } });
      if (table && table.tenantId === tenantId && table.isActive) {
        tableId = table.id;
        orderType = "DINE_IN";
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId },
        include: {
          variants: true,
          comboComponents: {
            include: {
              component: { select: { name: true } },
              componentVariant: { select: { name: true } },
            },
          },
        }
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

      // Cafe: a COMBO's contents are never customer-selectable — always the catalog's current
      // combo definition, snapshotted here so a later recipe edit never rewrites a past order
      // (same reasoning as lib/services/transactions.ts's comboComponents resolution for POS).
      const comboComponents = product.productType === "COMBO"
        ? product.comboComponents.map((c) => ({
            name: c.component.name,
            variantName: c.componentVariant?.name ?? null,
            quantity: c.quantity,
          }))
        : undefined;

      orderItems.push({
        productId: product.id,
        name: itemName,
        barcode,
        salePrice,
        quantity: item.quantity,
        itemTotal,
        ...(comboComponents && comboComponents.length > 0 ? { comboComponents } : {}),
      });
    }

    // Get shop tax rate
    const shop = await prisma.shop.findUnique({ where: { tenantId } });
    const taxRate = shop?.defaultTaxRate || 0;
    taxAmount = totalAmount * (taxRate / 100);
    const netAmount = totalAmount + taxAmount;

    // Find or create a Customer record for this tenant — for a logged-in customer, keyed to their
    // account; for a guest, keyed to their phone number so a repeat guest at the same table/cafe
    // still accumulates one CRM history instead of a fresh row every order.
    let customer = isCustomerSession
      ? await prisma.customer.findFirst({ where: { tenantId, customerAccountId: session!.user.id } })
      : await prisma.customer.findFirst({ where: { tenantId, phone: guestPhone.trim(), customerAccountId: null } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: isCustomerSession
          ? { name: session!.user.name || "Customer", email: session!.user.email, phone: null, tenantId, customerAccountId: session!.user.id }
          : { name: guestName.trim(), phone: guestPhone.trim(), tenantId },
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
        customerAccountId: isCustomerSession ? session!.user.id : null,
        customerId: customer.id,
        guestName: isCustomerSession ? null : guestName.trim(),
        guestPhone: isCustomerSession ? null : guestPhone.trim(),
        tableId,
        orderType,
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
