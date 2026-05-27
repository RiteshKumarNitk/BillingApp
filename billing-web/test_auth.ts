import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function test() {
  const user = await prisma.user.findUnique({where: {email: 'admin@example.com'}});
  console.log('User:', user);
  if(user) {
    const tenant = await prisma.tenant.findUnique({where: {id: user.tenantId}});
    console.log('Tenant:', tenant);
    const pass = await bcrypt.compare('password123', user.password);
    console.log('Password valid:', pass);
  }
}
test().finally(()=>prisma.$disconnect());
