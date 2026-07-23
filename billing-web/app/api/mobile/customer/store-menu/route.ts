import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/website/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Public, no auth — a cafe's menu is the same thing a guest can already see on its public website
// (app/site/[tenantId]/shop has no auth either), and the app's own "browse freely, only checkout
// needs login" principle means a not-logged-in customer must be able to open a cafe and see its
// menu, not just its profile. Rate-limited the same way /cafes is, now that it's reachable without
// an account.
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`mobile-store-menu:${ip}`, 60, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const search = searchParams.get("search") || "";

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Accepts either the raw tenant id or its websiteSlug, same as every other public cafe route.
    const tenantRecord = await resolveTenant(tenantId);
    if (!tenantRecord || tenantRecord.status !== "ACTIVE") {
      return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
    }
    const tenant = tenantRecord;

    // Fetch products for this store. Pre-existing bug fixed here: this used to filter on
    // `isActive`, a field Product doesn't have (it's `isAvailable`) — every call to this route
    // has been throwing a 500 until now.
    const where: any = {
      tenantId,
      isAvailable: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        addOns: true,
        comboComponents: {
          include: {
            component: { select: { name: true } },
            componentVariant: { select: { name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    // Active (non-coupon, auto-applied) discounts, matched to each product by category — same
    // eligibility rule createCustomerOrder() uses when actually applying one at checkout, so what a
    // customer sees on the menu is exactly what checkout will honor.
    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: {
        tenantId,
        isActive: true,
        code: null,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
    });
    const discountByCategory = new Map<string, (typeof discounts)[number]>();
    const storeWideDiscount = discounts.find((d) => !d.applicableCategory);
    for (const d of discounts) {
      if (d.applicableCategory) discountByCategory.set(d.applicableCategory, d);
    }

    // Group by category
    const categoryMap = new Map<string, any[]>();
    for (const product of products) {
      const category = product.category || "Other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      const discount = discountByCategory.get(category) || storeWideDiscount || null;
      categoryMap.get(category)!.push({
        id: product.id,
        name: product.name,
        description: product.description,
        salePrice: product.salePrice,
        mrp: product.mrp,
        stock: product.stock,
        imageUrl: product.imageUrl,
        category: product.category,
        productType: product.productType,
        barcode: product.barcode,
        variants: product.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          salePrice: v.salePrice,
          stock: v.stock,
          barcode: v.barcode,
        })),
        addOns: product.addOns.map((a: any) => ({ id: a.id, name: a.name, price: a.price })),
        comboComponents: product.comboComponents.map((c: any) => ({
          name: c.component.name,
          variantName: c.componentVariant?.name ?? null,
          quantity: c.quantity,
        })),
        activeDiscount: discount
          ? { id: discount.id, name: discount.name, discountPercentage: discount.discountPercentage, minimumQuantity: discount.minimumQuantity }
          : null,
      });
    }

    const categorizedProducts = Array.from(categoryMap.entries()).map(([category, items]) => ({
      category,
      items,
    }));

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        address: tenant.address,
        phone: tenant.phone,
      },
      categorizedProducts,
    });
  } catch (error) {
    console.error("Error fetching store menu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
