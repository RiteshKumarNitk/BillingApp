import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

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

    const { items, discount = 0 } = await request.json();

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

    // Calculate total amount and prepare transaction items
    let totalAmount = 0;
    const transactionItemsData = [];

    for (const item of items) {
      const { productId, quantity, salePrice } = item;

      // Fetch the product to get details and check stock
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      // Check if we have enough stock (if stock tracking is enabled)
      if (product.stock !== null && product.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = quantity * salePrice;
      totalAmount += itemTotal;

      transactionItemsData.push({
        productId,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchasePrice,
        mrp: product.mrp,
        salePrice,
        quantity,
        itemTotal
      });
    }

    // Calculate discount amount and net amount
    const discountAmount = (totalAmount * discount) / 100;
    const netAmount = totalAmount - discountAmount;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        totalAmount,
        discount,
        netAmount,
        status: 'COMPLETED',
        items: {
          create: transactionItemsData.map(item => ({
            product: { connect: { id: item.productId } },
            name: item.name,
            barcode: item.barcode || '',
            purchasePrice: item.purchasePrice,
            mrp: item.mrp,
            salePrice: item.salePrice,
            quantity: item.quantity,
            itemTotal: item.itemTotal
          }))
        }
      }
    });

    // Update product stock (decrement by quantity sold)
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
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