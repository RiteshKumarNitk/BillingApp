const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function clean() {
  const tenants = await prisma.tenant.findMany();
  
  const emails = new Set();
  const phones = new Set();

  for (const tenant of tenants) {
    let updateData = {};
    if (tenant.email) {
      if (emails.has(tenant.email)) {
        updateData.email = null;
        console.log(`Clearing duplicate email ${tenant.email} for tenant ${tenant.id}`);
      } else {
        emails.add(tenant.email);
      }
    }
    
    if (tenant.phone) {
      if (phones.has(tenant.phone)) {
        updateData.phone = null;
        console.log(`Clearing duplicate phone ${tenant.phone} for tenant ${tenant.id}`);
      } else {
        phones.add(tenant.phone);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.tenant.update({ where: { id: tenant.id }, data: updateData });
    }
  }

  // Also clean up duplicate subscription plans by name to be safe
  const plans = await prisma.subscriptionPlan.findMany();
  const planNames = new Set();
  for (const p of plans) {
    if (planNames.has(p.name)) {
      console.log(`Deleting duplicate plan ${p.name} with ID ${p.id}`);
      await prisma.subscriptionPlan.delete({ where: { id: p.id }});
    } else {
      planNames.add(p.name);
    }
  }

  console.log("Cleanup complete");
}

clean().finally(() => prisma.$disconnect());
