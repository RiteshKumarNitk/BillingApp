import prisma from './lib/prisma';

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
