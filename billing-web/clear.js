const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('Cleared dummy data!');
}

clear().catch(console.error).finally(()=>prisma.$disconnect());
