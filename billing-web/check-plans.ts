import prisma from "./lib/prisma";

async function check() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log(plans);
}
check().finally(() => prisma.$disconnect());
