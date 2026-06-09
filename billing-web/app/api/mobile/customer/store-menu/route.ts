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

    // Fetch products for this store
    const where: any = {
      tenantId,
      isActive: true,
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
