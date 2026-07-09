import prisma from '@/lib/prisma';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

async function getRequesterPermissions(tenantRoleId: string | null | undefined): Promise<string[]> {
  if (!tenantRoleId) return [];
  const role = await prisma.role.findUnique({ where: { id: tenantRoleId } });
  return role?.permissions || [];
}

export async function PUT(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPERADMIN') {
      const permissions = await getRequesterPermissions(user.tenantRole as string | null);
      if (!permissions.includes('EDIT_PRODUCT')) {
        return corsResponse({ error: 'Forbidden: Requires EDIT_PRODUCT permission' }, { status: 403 });
      }
    }

    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return corsResponse({ error: 'No products provided' }, { status: 400 });
    }

    // Verify all variants belong to the user's tenant via their parent product
    const variantItems = products.filter((item: any) => item.type === 'variant');
    const variantIds = variantItems.map((item: any) => item.id);

    if (variantIds.length > 0) {
      const ownedVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { tenantId: true } } },
      });

      if (ownedVariants.length !== variantIds.length) {
        return corsResponse({ error: 'One or more variants not found' }, { status: 404 });
      }

      for (const v of ownedVariants) {
        if (v.product.tenantId !== user.tenantId) {
          return corsResponse({ error: 'Unauthorized: Variant does not belong to your tenant' }, { status: 403 });
        }
      }
    }

    // Verify all plain products belong to the user's tenant
    const productItems = products.filter((item: any) => item.type !== 'variant');
    const productIds = productItems.map((item: any) => item.id);

    if (productIds.length > 0) {
      const ownedProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, tenantId: user.tenantId },
        select: { id: true },
      });
      if (ownedProducts.length !== productIds.length) {
        return corsResponse({ error: 'One or more products not found or do not belong to your tenant' }, { status: 404 });
      }
    }

    // All updates succeed or fail together
    const updatePromises = products.map((item: any) => {
      const data = {
        stock: parseFloat(item.stock),
        purchasePrice: parseFloat(item.purchasePrice),
        mrp: parseFloat(item.mrp),
        salePrice: parseFloat(item.salePrice),
      };

      if (item.type === 'variant') {
        return prisma.productVariant.update({
          where: { id: item.id },
          data,
        });
      } else {
        return prisma.product.update({
          where: { id: item.id, tenantId: user.tenantId as string },
          data,
        });
      }
    });

    await prisma.$transaction(updatePromises);

    return corsResponse({ success: true, count: products.length });
  } catch (error: any) {
    console.error('Mobile bulk inventory update error:', error);
    return corsResponse({ error: error.message || 'Failed to update inventory' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
