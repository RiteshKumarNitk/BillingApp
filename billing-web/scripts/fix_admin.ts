import prisma from '../lib/prisma';

async function main() {
  console.log('Fixing admin user...');
  
  // Find or create System tenant
  let systemTenant = await prisma.tenant.findUnique({
    where: { domain: 'system.example.com' }
  });
  
  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'System Administration',
        domain: 'system.example.com',
        dbConnectionString: 'system_default',
        status: 'ACTIVE',
      }
    });
  }

  // Update admin user to be SUPERADMIN
  const updatedUser = await prisma.user.updateMany({
    where: { email: 'admin@example.com' },
    data: {
      role: 'SUPERADMIN',
      tenantId: systemTenant.id
    }
  });
  
  console.log(`Updated ${updatedUser.count} user(s) to SUPERADMIN.`);
  
  const users = await prisma.user.findMany({
    select: { email: true, role: true, tenant: { select: { name: true } } }
  });
  console.log('Current users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
