import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveTenant } from "@/lib/website/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { cachedPublic } from "@/lib/publicCache";

const MENU_ITEM_CEILING = 1000;

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

    // Phase 9: the plain (no-search) menu is identical for every visitor of a cafe and is the
    // highest-volume app request, so it is served from the short-TTL public cache (30s; same-
    // instance product edits invalidate immediately). Searches are not cached (unbounded keys).
    const result = search
      ? await buildStoreMenu(tenantId, search)
      : await cachedPublic(`store-menu:${tenantId}`, () => buildStoreMenu(tenantId, ""));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Error fetching store menu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function buildStoreMenu(tenantId: string, search: string): Promise<{ status: number; body: unknown }> {
    // Accepts either the raw tenant id or its websiteSlug, same as every other public cafe route.
    const tenantRecord = await resolveTenant(tenantId);
    if (!tenantRecord || tenantRecord.status !== "ACTIVE") {
      return { status: 404, body: { error: "Store not found or inactive" } };
    }
    const tenant = tenantRecord;

    // Fetch products for this store. `tenantId` here is whatever the caller passed (id or slug) —
    // must filter by the resolved tenant.id, not the raw param, or a slug-based lookup silently
    // matches zero products.
    const where: any = {
      tenantId: tenant.id,
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
      // P4: the menu is returned whole (the app groups it by category, so paging doesn't fit).
      // The old 200 cap silently hid items from larger menus; this is just a safety ceiling.
      take: MENU_ITEM_CEILING,
    });
    if (products.length === MENU_ITEM_CEILING) {
      console.warn(`store-menu: tenant ${tenant.id} hit the ${MENU_ITEM_CEILING}-item ceiling; some items are not shown`);
    }

    // Active (non-coupon, auto-applied) discounts, matched to each product by category — same
    // eligibility rule createCustomerOrder() uses when actually applying one at checkout, so what a
    // customer sees on the menu is exactly what checkout will honor.
    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: {
        tenantId: tenant.id,
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
        foodType: product.foodType,
        isFeatured: product.isFeatured,
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

    return {
      status: 200,
      body: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          address: tenant.address,
          phone: tenant.phone,
        },
        categorizedProducts,
      },
    };
}
