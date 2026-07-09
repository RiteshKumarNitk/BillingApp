import prisma from '../lib/prisma';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@gmail.com';
  const password = 'admin123';
  
  console.log(`Setting up superadmin: ${email}`);

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if a superadmin tenant exists, if not create a 'System' tenant
  let systemTenant = await prisma.tenant.findFirst({
    where: { domain: 'system' }
  });

  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'System Administration',
        domain: 'system',
        dbConnectionString: 'default',
        status: 'ACTIVE',
      }
    });
    console.log('Created System Tenant');
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        role: 'SUPERADMIN',
        tenantId: systemTenant.id
      }
    });
    console.log(`Updated existing user ${email} to SUPERADMIN with new password.`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'SUPERADMIN',
        tenantId: systemTenant.id
      }
    });
    console.log(`Created new SUPERADMIN user ${email}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
