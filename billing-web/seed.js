// Simple seed script that creates its own PrismaClient instance
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a tenant if it doesn't exist
  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Acme Corp' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Acme Corp',
        domain: 'acme.example.com',
        dbConnectionString: '', // In a real app, this would be set per tenant
        status: 'ACTIVE'
      }
    });
    console.log('Created tenant: Acme Corp');
  } else {
    console.log('Tenant Acme Corp already exists');
  }

  // Create a user if it doesn't exist
  let user = await prisma.user.findFirst({
    where: { email: 'admin@example.com', tenantId: tenant.id }
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        tenantId: tenant.id,
        role: 'ADMIN'
      }
    });
    console.log('Created user: admin@example.com');
  } else {
    console.log('User admin@example.com already exists');
  }

  // Create some products if they don't exist
  const productData = [
    {
      name: 'Apple iPhone 13',
      barcode: '0012345678905',
      purchasePrice: 600.00,
      mrp: 999.00,
      salePrice: 899.00,
      stock: 50,
      category: 'Electronics'
    },
    {
      name: 'Samsung Galaxy S21',
      barcode: '0012345678906',
      purchasePrice: 500.00,
      mrp: 899.00,
      salePrice: 799.00,
      stock: 30,
      category: 'Electronics'
    },
    {
      name: 'Levi\'s Jeans',
      barcode: '0012345678907',
      purchasePrice: 30.00,
      mrp: 80.00,
      salePrice: 60.00,
      stock: 100,
      category: 'Clothing'
    },
    {
      name: 'Nike Running Shoes',
      barcode: '0012345678908',
      purchasePrice: 40.00,
      mrp: 120.00,
      salePrice: 95.00,
      stock: 70,
      category: 'Footwear'
    },
    {
      name: 'Coca-Cola 2L',
      barcode: '0012345678909',
      purchasePrice: 1.00,
      mrp: 3.00,
      salePrice: 2.50,
      stock: 200,
      category: 'Beverages'
    }
  ];

  for (const data of productData) {
    const existingProduct = await prisma.product.findFirst({
      where: { barcode: data.barcode, tenantId: tenant.id }
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          ...data,
          tenantId: tenant.id
        }
      });
      console.log(`Created product: ${data.name}`);
    } else {
      console.log(`Product ${data.name} already exists`);
    }
  }

  // Create some transactions if they don't exist
  // We'll create transactions for the last 30 days
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id }
  });

  if (products.length === 0) {
    console.log('No products found to create transactions');
    await prisma.$disconnect();
    return;
  }

  // We'll create 5 transactions
  for (let i = 0; i < 5; i++) {
    // Check if we already have enough transactions (optional)
    const transactionCount = await prisma.transaction.count({
      where: { tenantId: tenant.id }
    });

    if (transactionCount >= 5) {
      console.log('Already have 5 or more transactions, skipping transaction creation');
      break;
    }

    // Select random products for this transaction
    const selectedProducts = [];
    let remaining = Math.floor(Math.random() * 3) + 1; // 1 to 3 products
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    for (let j = 0; j < remaining && j < shuffled.length; j++) {
      selectedProducts.push(shuffled[j]);
    }

    // Calculate totals
    let totalAmount = 0;
    const transactionItems = [];
    const discount = Math.floor(Math.random() * 11); // 0 to 10% discount

    for (const product of selectedProducts) {
      const quantity = Math.floor(Math.random() * 5) + 1; // 1 to 5 quantity
      const salePrice = product.salePrice; // We could vary this, but for simplicity we use the product's sale price
      const itemTotal = quantity * salePrice;
      totalAmount += itemTotal;

      transactionItems.push({
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        purchasePrice: product.purchasePrice,
        mrp: product.mrp,
        salePrice: salePrice,
        quantity: quantity,
        itemTotal: itemTotal
      });
    }

    const discountAmount = (totalAmount * discount) / 100;
    const netAmount = totalAmount - discountAmount;

    // Create a random date in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    date.setSeconds(Math.floor(Math.random() * 60));

    // Create the transaction
    await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        totalAmount: totalAmount,
        discount: discount,
        netAmount: netAmount,
        status: 'COMPLETED',
        createdAt: date,
        updatedAt: date,
        items: {
          create: transactionItems
        }
      }
    });

    console.log(`Created transaction ${i + 1} with ${selectedProducts.length} items`);
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });