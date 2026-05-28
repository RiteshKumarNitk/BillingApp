import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Create the System Tenant (Master Tenant for Superadmin)
  const systemTenant = await prisma.tenant.upsert({
    where: { domain: 'system.example.com' },
    update: {},
    create: {
      name: 'System Administration',
      domain: 'system.example.com',
      dbConnectionString: 'system_default', // Placeholder for single-DB architecture
      status: 'ACTIVE',
    },
  });

  console.log('System Tenant created/verified:', systemTenant.id);

  // 2. Create the Superadmin User
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Superadmin',
      role: 'SUPERADMIN',
      tenantId: systemTenant.id,
    },
  });

  console.log('Superadmin created/verified:', superAdmin.email);

  // 3. Create dummy data for the dashboard (Optional, just to populate charts)
  // Let's create a few products and transactions for the System Tenant
  
  const productsCount = await prisma.product.count({
    where: { tenantId: systemTenant.id }
  });

  if (productsCount === 0) {
    console.log('Adding dummy products and transactions...');
    
    // Products
    const prod1 = await prisma.product.create({
      data: {
        name: 'Premium Subscription',
        barcode: 'SUB-001',
        purchasePrice: 0,
        mrp: 99.99,
        salePrice: 99.99,
        stock: 9999,
        category: 'Services',
        tenantId: systemTenant.id
      }
    });

    const prod2 = await prisma.product.create({
      data: {
        name: 'Hardware Terminal',
        barcode: 'HW-001',
        purchasePrice: 150.00,
        mrp: 299.99,
        salePrice: 249.99,
        stock: 50,
        category: 'Hardware',
        tenantId: systemTenant.id
      }
    });

    // Transactions
    await prisma.transaction.create({
      data: {
        tenantId: systemTenant.id,
        userId: superAdmin.id,
        totalAmount: 349.98,
        netAmount: 349.98,
        items: {
          create: [
            {
              product: { connect: { id: prod1.id } },
              name: prod1.name,
              barcode: prod1.barcode || '',
              purchasePrice: prod1.purchasePrice,
              mrp: prod1.mrp,
              salePrice: prod1.salePrice,
              quantity: 1,
              itemTotal: 99.99
            },
            {
              product: { connect: { id: prod2.id } },
              name: prod2.name,
              barcode: prod2.barcode || '',
              purchasePrice: prod2.purchasePrice,
              mrp: prod2.mrp,
              salePrice: prod2.salePrice,
              quantity: 1,
              itemTotal: 249.99
            }
          ]
        }
      }
    });
    
    console.log('Dummy products and transactions created!');
  }

  // 4. Create a demo tenant with all mobile-related data
  const demoCount = await prisma.tenant.count({ where: { domain: 'demo.example.com' } });
  if (demoCount === 0) {
    console.log('Creating demo tenant with mobile data...');

    const demoPassword = await bcrypt.hash('demo123', 10);
    const demoRole = await prisma.role.create({
      data: {
        name: 'Owner',
        tenant: { connect: { id: systemTenant.id } },
        permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT'],
      }
    });

    // Demo customers
    const customers = [
      { name: 'Ravi Kumar', phone: '9876543210', totalSpent: 15000, loyaltyPoints: 150 },
      { name: 'Priya Sharma', phone: '9876543211', totalSpent: 8500, loyaltyPoints: 85 },
      { name: 'Amit Singh', phone: '9876543212', totalSpent: 22000, loyaltyPoints: 220 },
    ];
    for (const c of customers) {
      await prisma.customer.create({
        data: { ...c, tenantId: systemTenant.id, lastPurchaseDate: new Date() }
      });
    }

    // Demo discounts
    await prisma.discount.create({
      data: {
        name: 'Summer Sale',
        description: '10% off on all products',
        discountPercentage: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        tenantId: systemTenant.id,
      }
    });

    // Demo shop
    await prisma.shop.create({
      data: {
        name: 'Demo General Store',
        addressLine1: '123 Main Street',
        phoneNumber: '9876543210',
        upiId: 'demo@upi',
        footerText: 'Thank you! Visit again.',
        defaultTaxRate: 5,
        tenantId: systemTenant.id,
      }
    });

    // Demo employee
    await prisma.employee.create({
      data: {
        name: 'Cashier Demo',
        email: 'cashier@demo.com',
        password: demoPassword,
        role: 'CASHIER',
        isActive: true,
        tenantId: systemTenant.id,
      }
    });

    console.log('Demo tenant created with customers, discounts, shop, and employees!');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });