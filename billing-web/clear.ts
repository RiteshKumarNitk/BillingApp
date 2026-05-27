import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import prisma from './lib/prisma';

async function clear() {
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('Cleared dummy data!');
}

clear().catch(console.error).finally(()=>prisma.$disconnect());
