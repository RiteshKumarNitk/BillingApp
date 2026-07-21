import prisma from './lib/prisma';

const TENANT_ID = '6a4cc16e-4cec-481b-b584-d40469cbc290'; // main admin

(async () => {
  const original = await prisma.tenant.findUnique({ where: { id: TENANT_ID }, select: { businessType: true } });
  console.log('Original businessType:', original?.businessType);
  await prisma.tenant.update({ where: { id: TENANT_ID }, data: { businessType: 'CAFE' } });

  const coldCoffee = await prisma.product.create({
    data: {
      tenantId: TENANT_ID,
      name: '__combo_test_cold_coffee',
      productType: 'VARIANT',
      salePrice: 0,
      purchasePrice: 0,
      mrp: 0,
      category: 'Beverages',
      variants: {
        create: [
          { name: 'Small', salePrice: 60, purchasePrice: 30, mrp: 70, stock: 50 },
          { name: 'Large', salePrice: 90, purchasePrice: 45, mrp: 100, stock: 50 },
        ],
      },
    },
    include: { variants: true },
  });

  const momos = await prisma.product.create({
    data: {
      tenantId: TENANT_ID,
      name: '__combo_test_momos',
      productType: 'VARIANT',
      salePrice: 0,
      purchasePrice: 0,
      mrp: 0,
      category: 'Starters',
      variants: {
        create: [
          { name: 'Small', salePrice: 50, purchasePrice: 25, mrp: 60, stock: 50 },
          { name: 'Large', salePrice: 80, purchasePrice: 40, mrp: 90, stock: 50 },
        ],
      },
    },
    include: { variants: true },
  });

  const friesSimple = await prisma.product.create({
    data: {
      tenantId: TENANT_ID,
      name: '__combo_test_fries',
      productType: 'SIMPLE',
      salePrice: 40,
      purchasePrice: 20,
      mrp: 50,
      stock: 50,
      category: 'Sides',
    },
  });

  console.log('Cold Coffee:', coldCoffee.id, coldCoffee.variants.map(v => `${v.name}=${v.id}`));
  console.log('Momos:', momos.id, momos.variants.map(v => `${v.name}=${v.id}`));
  console.log('Fries (simple, alt swap target):', friesSimple.id);
  await prisma.$disconnect();
})();
