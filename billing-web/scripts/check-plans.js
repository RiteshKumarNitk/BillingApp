const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function check() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log(plans);
}
check().finally(() => prisma.$disconnect());
