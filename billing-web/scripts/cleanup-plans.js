const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function clean() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  const planNames = new Set();
  let deletedCount = 0;

  for (const p of plans) {
    if (planNames.has(p.name)) {
      console.log(`Deleting duplicate plan ${p.name} with ID ${p.id}`);
      try {
        await prisma.subscriptionPlan.delete({ where: { id: p.id }});
        deletedCount++;
      } catch (e) {
        console.error(`Could not delete ${p.name} (${p.id}):`, e.message);
      }
    } else {
      planNames.add(p.name);
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} duplicate plans.`);
}

clean().finally(() => prisma.$disconnect());
