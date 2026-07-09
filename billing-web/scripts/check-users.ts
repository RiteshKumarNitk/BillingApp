import prisma from '../lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ include: { tenant: true } });
  console.log(JSON.stringify(users.map(u => ({ email: u.email, name: u.name, tenantName: u.tenant.name, tenantId: u.tenantId })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
