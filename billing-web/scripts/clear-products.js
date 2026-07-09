const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  console.log('Successfully cleared all products and transactions.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
