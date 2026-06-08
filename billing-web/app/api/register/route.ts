import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, tenantName, phone, address, gstin } = await request.json();

    // Validate input
    if (!name || !email || !password || !tenantName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists BEFORE creating anything (prevents orphaned tenants)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Generate a unique domain to avoid conflicts
    const baseDomain = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'tenant';
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const domain = `${baseDomain}-${uniqueSuffix}.example.com`;

    // Use a transaction to ensure tenant + user + roles are created atomically
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          domain,
          dbConnectionString: '',
          status: 'ACTIVE',
          contactPerson: name,
          email,
          phone: phone || null,
          address: address || null,
          gstin: gstin || null,
          subscriptionPlan: 'FREE',
        }
      });

      let ownerRoleId = null;
      const rolesData = [
        { name: 'Owner', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT'] },
        { name: 'Manager', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'VIEW_PROFIT'] },
        { name: 'Cashier', permissions: ['CREATE_BILL', 'VIEW_PRODUCT'] }
      ];

      for (const roleData of rolesData) {
        const role = await tx.role.create({
          data: {
            name: roleData.name,
            permissions: roleData.permissions,
            tenantId: tenant.id
          }
        });
        if (role.name === 'Owner') {
          ownerRoleId = role.id;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          tenantId: tenant.id,
          tenantRoleId: ownerRoleId,
          role: 'ADMIN',
        }
      });

      return { tenant, user };
    });

    const { password: _, ...userWithoutPassword } = result.user;

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userWithoutPassword,
        tenant: result.tenant
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}