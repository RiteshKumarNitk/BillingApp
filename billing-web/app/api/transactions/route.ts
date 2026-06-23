import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from "@/lib/prisma";
import { checkFeatureLimit } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const permissions = (token.permissions as string[]) || [];
    const role = token.role as string;
    
    if (role !== 'SUPERADMIN' && !permissions.includes('CREATE_BILL')) {
      return NextResponse.json(
        { error: 'Forbidden: Requires CREATE_BILL permission' },
        { status: 403 }
      );
    }

    const { items, discount = 0, taxAmount = 0, customerName, customerPhone, paymentMethod, amountReceived, changeAmount } = await request.json();

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required and must be an array' },
        { status: 400 }
      );
    }

    // Fetch the user to get tenantId
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify transaction limit
    const limitCheck = await checkFeatureLimit(user.tenantId, "transactions");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason },
        { status: 403 }
      );
    }

    // Verify all products belong to the user's tenant
    const productIds = items.map((item: any) => item.productId);
    const uniqueProductIds = Array.from(new Set(productIds));
    
    const ownedProducts = await prisma.product.findMany({
      where: { 
        id: { in: uniqueProductIds },
        tenantId: user.tenantId
      },
      select: { id: true }
    });

    if (ownedProducts.length !== uniqueProductIds.length) {
      return NextResponse.json(
        { error: 'Unauthorized: One or more products do not belong to your tenant' },
        { status: 403 }
      );
    }

    // Calculate total amount and prepare transaction items
    let totalAmount = 0;
    const transactionItemsData = [];

    for (const item of items) {
      const { 
        productId, quantity, salePrice, 
        variantId, batchId, serialId, 
        titleOverride, purchasePrice, mrp, productType
      } = item;

      const parsedQuantity = parseFloat(quantity) || 1;
      const parsedSalePrice = parseFloat(salePrice) || 0;
      const itemTotal = parsedQuantity * parsedSalePrice;
      totalAmount += itemTotal;

      transactionItemsData.push({
        productId,
        name: titleOverride || 'Product',
        barcode: '',
        purchasePrice: parseFloat(purchasePrice) || 0,
        mrp: parseFloat(mrp) || 0,
        salePrice: parsedSalePrice,
        quantity: parsedQuantity,
        itemTotal,
        variantId,
        batchId,
        serialId
      });
    }

    // Calculate discount amount and net amount
    const discountAmount = (totalAmount * discount) / 100;
    const parsedTaxAmount = parseFloat(taxAmount) || 0;
    const netAmount = totalAmount - discountAmount + parsedTaxAmount;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        totalAmount,
        discount,
        taxAmount: parsedTaxAmount,
        netAmount,
        status: 'COMPLETED',
        paymentMethod: paymentMethod || null,
        amountReceived: amountReceived ? parseFloat(amountReceived) : null,
        changeAmount: changeAmount ? parseFloat(changeAmount) : null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        items: {
          create: transactionItemsData.map(item => ({
            product: { connect: { id: item.productId } },
            name: item.name,
            barcode: item.barcode,
            purchasePrice: item.purchasePrice,
            mrp: item.mrp,
            salePrice: item.salePrice,
            quantity: item.quantity,
            itemTotal: item.itemTotal,
            variantId: item.variantId,
            batchId: item.batchId,
            serialId: item.serialId
          }))
        }
      }
    });

    // Surgical Stock Deduction based on ProductType
    for (const item of items) {
      const { productId, quantity, productType, variantId, batchId, serialId } = item;

      if (productType === 'SIMPLE' || productType === 'WEIGHT') {
        // Safe: productId is already verified to belong to the tenant above
        await prisma.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } }
        });
      } else if (productType === 'VARIANT' && variantId) {
        await prisma.productVariant.updateMany({
          where: { id: variantId, productId: productId },
          data: { stock: { decrement: quantity } }
        });
      } else if (productType === 'BATCH' && batchId) {
        await prisma.productBatch.updateMany({
          where: { id: batchId, productId: productId },
          data: { stock: { decrement: quantity } }
        });
      } else if (productType === 'SERIAL' && serialId) {
        // Mark serial as sold
        await prisma.productSerial.updateMany({
          where: { id: serialId, productId: productId },
          data: { status: 'SOLD' }
        });
      }
      // SERVICE types do not have stock deducted.
    }

    return NextResponse.json(
      { 
        message: 'Transaction created successfully',
        transaction
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}