import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

const TENANT_ID = '6a4cc16e-4cec-481b-b584-d40469cbc290';

(async () => {
  let role = await prisma.role.findFirst({ where: { tenantId: TENANT_ID, name: 'Owner' } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId: TENANT_ID,
        name: 'Owner',
        permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT', 'OVERRIDE_PRICE'],
      },
    });
  }
  const existing = await prisma.user.findUnique({ where: { email: 'combotest@example.com' } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }
  const hashed = await bcrypt.hash('testpass123', 10);
  const user = await prisma.user.create({
    data: { name: 'Combo Test Admin', email: 'combotest@example.com', password: hashed, tenantId: TENANT_ID, role: 'ADMIN', tenantRoleId: role.id },
  });
  console.log('Test admin user created:', user.email);
  await prisma.$disconnect();
})();
