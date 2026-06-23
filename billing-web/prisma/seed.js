require("dotenv").config();
const { PrismaClient } = require("../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database via JS...");

  // 1. Create the System Tenant (Master Tenant for Superadmin)
  const systemTenant = await prisma.tenant.upsert({
    where: { domain: "system" },
    update: {},
    create: {
      name: "System Administration",
      domain: "system",
      dbConnectionString: "system_default",
      status: "ACTIVE"
    }
  });

  console.log("System Tenant created/verified:", systemTenant.id);

  // 2. Create the Superadmin User (admin@gmail.com / admin123)
  const superAdminHashedPassword = await bcrypt.hash("admin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      password: superAdminHashedPassword,
      name: "System Superadmin",
      role: "SUPERADMIN",
      tenantId: systemTenant.id
    }
  });

  console.log("Superadmin created/verified:", superAdmin.email);

  // 3. Seed Subscription Plans
  console.log("Seeding Subscription Plans...");
  const plans = [
    {
      name: "FREE",
      description: "Basic starter plan for small shops",
      amount: 0,
      interval: "MONTHLY",
      trialDays: 0,
      maxProducts: 10,
      maxUsers: 2,
      maxTransactions: 20
    },
    {
      name: "GROWTH",
      description: "Ideal plan for growing businesses",
      amount: 999,
      interval: "MONTHLY",
      trialDays: 14,
      maxProducts: 100,
      maxUsers: 10,
      maxTransactions: 1000
    },
    {
      name: "ENTERPRISE",
      description: "Unlimited plan for large enterprises",
      amount: 4999,
      interval: "MONTHLY",
      trialDays: 0,
      maxProducts: -1,
      maxUsers: -1,
      maxTransactions: -1
    }
  ];

  const dbPlans = [];
  for (const p of plans) {
    const dbPlan = await prisma.subscriptionPlan.upsert({
      where: { id: p.name },
      update: {
        description: p.description,
        amount: p.amount,
        interval: p.interval,
        trialDays: p.trialDays,
        maxProducts: p.maxProducts,
        maxUsers: p.maxUsers,
        maxTransactions: p.maxTransactions
      },
      create: {
        id: p.name,
        name: p.name,
        description: p.description,
        amount: p.amount,
        interval: p.interval,
        trialDays: p.trialDays,
        maxProducts: p.maxProducts,
        maxUsers: p.maxUsers,
        maxTransactions: p.maxTransactions
      }
    });
    dbPlans.push(dbPlan);
  }
  console.log("Subscription plans seeded!");

  // 4. Seed Coupon Codes
  console.log("Seeding discount coupons...");
  const coupons = [
    { code: "WELCOME50", discountType: "PERCENTAGE", discountValue: 50 },
    { code: "SAVE200", discountType: "FIXED", discountValue: 200 }
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        isActive: true
      }
    });
  }

  const growthPlan = dbPlans.find(p => p.name === "GROWTH");

  // 5. Seed Tenant Acme Corp (domain: acme.example.com)
  console.log("Seeding Acme Corp Tenant...");
  const acmeTenant = await prisma.tenant.upsert({
    where: { domain: "acme.example.com" },
    update: {
      subscriptionPlan: growthPlan.name
    },
    create: {
      name: "Acme Corp",
      domain: "acme.example.com",
      dbConnectionString: "",
      status: "ACTIVE",
      subscriptionPlan: growthPlan.name
    }
  });

  // Create roles for Acme Corp
  const rolesData = [
    { name: "Owner", permissions: ["CREATE_PRODUCT", "EDIT_PRODUCT", "DELETE_PRODUCT", "VIEW_REPORTS", "CREATE_BILL", "MANAGE_USERS", "VIEW_PROFIT"] },
    { name: "Manager", permissions: ["CREATE_PRODUCT", "EDIT_PRODUCT", "VIEW_REPORTS", "CREATE_BILL", "VIEW_PROFIT"] },
    { name: "Cashier", permissions: ["CREATE_BILL", "VIEW_PRODUCT"] }
  ];

  let acmeOwnerRole = null;
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: acmeTenant.id, name: r.name } },
      update: { permissions: r.permissions },
      create: {
        name: r.name,
        permissions: r.permissions,
        tenantId: acmeTenant.id
      }
    });
    if (role.name === "Owner") {
      acmeOwnerRole = role;
    }
  }

  // Create Acme Corp admin user (admin@example.com / password123)
  const acmeHashedPassword = await bcrypt.hash("password123", 10);
  const acmeUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      tenantId: acmeTenant.id,
      tenantRoleId: acmeOwnerRole.id,
      role: "ADMIN"
    },
    create: {
      email: "admin@example.com",
      password: acmeHashedPassword,
      name: "Admin User",
      role: "ADMIN",
      tenantId: acmeTenant.id,
      tenantRoleId: acmeOwnerRole.id
    }
  });
  console.log("Acme Corp Admin User created/verified:", acmeUser.email);

  // Seed Subscription for Acme Corp
  const acmeSubStartDate = new Date();
  acmeSubStartDate.setDate(acmeSubStartDate.getDate() - 10);
  const acmeSubEndDate = new Date();
  acmeSubEndDate.setDate(acmeSubEndDate.getDate() + 20);

  const acmeSubCount = await prisma.tenantSubscription.count({ where: { tenantId: acmeTenant.id } });
  if (acmeSubCount === 0) {
    const acmeSub = await prisma.tenantSubscription.create({
      data: {
        tenantId: acmeTenant.id,
        planId: growthPlan.id,
        status: "ACTIVE",
        razorpaySubscriptionId: "sub_acme_growth123",
        startDate: acmeSubStartDate,
        endDate: acmeSubEndDate
      }
    });

    await prisma.invoice.create({
      data: {
        tenantId: acmeTenant.id,
        subscriptionId: acmeSub.id,
        invoiceNumber: "INV-ACME-0001",
        amount: growthPlan.amount,
        discountAmount: 0,
        netAmount: growthPlan.amount,
        currency: "INR",
        status: "PAID",
        billingDate: acmeSubStartDate,
        paidAt: acmeSubStartDate,
        razorpayPaymentId: "pay_acme_success1"
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: acmeTenant.id,
        action: "SUBSCRIPTION_ACTIVATED",
        details: "Acme Corp active GROWTH plan subscription seeded."
      }
    });
  }

  // Seed products for Acme Corp if none exist
  const acmeProdCount = await prisma.product.count({ where: { tenantId: acmeTenant.id } });
  if (acmeProdCount === 0) {
    const productData = [
      { name: "Apple iPhone 13", barcode: "0012345678905", purchasePrice: 600.00, mrp: 999.00, salePrice: 899.00, stock: 50, category: "Electronics" },
      { name: "Samsung Galaxy S21", barcode: "0012345678906", purchasePrice: 500.00, mrp: 899.00, salePrice: 799.00, stock: 30, category: "Electronics" },
      { name: "Levi's Jeans", barcode: "0012345678907", purchasePrice: 30.00, mrp: 80.00, salePrice: 60.00, stock: 100, category: "Clothing" },
      { name: "Nike Running Shoes", barcode: "0012345678908", purchasePrice: 40.00, mrp: 120.00, salePrice: 95.00, stock: 70, category: "Footwear" },
      { name: "Coca-Cola 2L", barcode: "0012345678909", purchasePrice: 1.00, mrp: 3.00, salePrice: 2.50, stock: 200, category: "Beverages" }
    ];

    for (const p of productData) {
      await prisma.product.create({
        data: { ...p, tenantId: acmeTenant.id }
      });
    }

    // Seed shop configuration for Acme Corp
    await prisma.shop.create({
      data: {
        name: "Acme Super Store",
        addressLine1: "Acme Street 1",
        phoneNumber: "1112223334",
        upiId: "acme@upi",
        footerText: "Thanks for shopping!",
        defaultTaxRate: 18,
        tenantId: acmeTenant.id
      }
    });

    console.log("Acme Corp inventory seeded.");
  }

  // 6. Create Demo General Store tenant (domain: demo.example.com)
  const demoCount = await prisma.tenant.count({ where: { domain: "demo.example.com" } });
  if (demoCount === 0) {
    console.log("Creating demo tenant with mobile and billing data...");

    const demoTenant = await prisma.tenant.create({
      data: {
        name: "Demo General Store",
        domain: "demo.example.com",
        dbConnectionString: "demo_default",
        status: "ACTIVE",
        contactPerson: "Demo Owner",
        email: "owner@demo.com",
        phone: "9876543210",
        subscriptionPlan: growthPlan.name
      }
    });

    const demoPassword = await bcrypt.hash("demo123", 10);
    
    // Create role under demo tenant
    const demoRole = await prisma.role.create({
      data: {
        name: "Owner",
        tenantId: demoTenant.id,
        permissions: ["CREATE_PRODUCT", "EDIT_PRODUCT", "DELETE_PRODUCT", "VIEW_REPORTS", "CREATE_BILL", "MANAGE_USERS", "VIEW_PROFIT"]
      }
    });

    // Create demo admin user for the demo tenant
    await prisma.user.create({
      data: {
        email: "owner@demo.com",
        password: demoPassword,
        name: "Demo Owner",
        role: "ADMIN",
        tenantId: demoTenant.id,
        tenantRoleId: demoRole.id
      }
    });

    // Seed Active TenantSubscription for demo tenant
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 15);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 15);
    
    const tenantSub = await prisma.tenantSubscription.create({
      data: {
        tenantId: demoTenant.id,
        planId: growthPlan.id,
        status: "ACTIVE",
        razorpaySubscriptionId: "sub_demo_growth123",
        startDate,
        endDate
      }
    });

    await prisma.invoice.create({
      data: {
        tenantId: demoTenant.id,
        subscriptionId: tenantSub.id,
        invoiceNumber: "INV-DEMO-0001",
        amount: growthPlan.amount,
        discountAmount: 0,
        netAmount: growthPlan.amount,
        currency: "INR",
        status: "PAID",
        billingDate: startDate,
        paidAt: startDate,
        razorpayPaymentId: "pay_demo_success1"
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: demoTenant.id,
        action: "SUBSCRIPTION_ACTIVATED",
        details: "Subscription for GROWTH plan activated successfully."
      }
    });

    // Demo products under demo tenant
    const products = [
      { name: "Jeans", category: "Apparel", mrp: 1200, salePrice: 999, purchasePrice: 600, stock: 15, barcode: "JEANS01" },
      { name: "Shoes", category: "Footwear", mrp: 2500, salePrice: 1999, purchasePrice: 1000, stock: 8, barcode: "SHOES01" },
      { name: "Coca-Cola", category: "Beverages", mrp: 40, salePrice: 38, purchasePrice: 28, stock: 100, barcode: "COKE01" }
    ];

    for (const p of products) {
      await prisma.product.create({
        data: { ...p, tenantId: demoTenant.id }
      });
    }

    // Demo customers under demo tenant
    const customers = [
      { name: "Ravi Kumar", phone: "9876543210", totalSpent: 15000, loyaltyPoints: 150 },
      { name: "Priya Sharma", phone: "9876543211", totalSpent: 8500, loyaltyPoints: 85 }
    ];
    for (const c of customers) {
      await prisma.customer.create({
        data: { ...c, tenantId: demoTenant.id, lastPurchaseDate: new Date() }
      });
    }

    // Demo shop under demo tenant
    await prisma.shop.create({
      data: {
        name: "Demo General Store",
        addressLine1: "123 Main Street",
        phoneNumber: "9876543210",
        upiId: "demo@upi",
        footerText: "Thank you! Visit again.",
        defaultTaxRate: 5,
        tenantId: demoTenant.id
      }
    });

    console.log("Demo tenant subscription & inventory seeded!");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });