import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerIdFromAuthHeader } from "@/lib/auth/customer-mobile";

export async function GET(request: NextRequest) {
  try {
    const customerAccountId = await getCustomerIdFromAuthHeader(request);
    if (!customerAccountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const search = searchParams.get("search") || "";

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
    }

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

    // Group by category
    const categoryMap = new Map<string, any[]>();
    for (const product of products) {
      const category = product.category || "Other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
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
        comboComponents: product.comboComponents.map((c: any) => ({
          name: c.component.name,
          variantName: c.componentVariant?.name ?? null,
          quantity: c.quantity,
        })),
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
