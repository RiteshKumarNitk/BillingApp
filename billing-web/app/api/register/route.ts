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

    // Check if tenant exists by name, if not create it
    let tenant = await prisma.tenant.findFirst({
      where: { name: tenantName }
    });

    let isNewTenant = false;

    if (!tenant) {
      const tenantCreateData: any = {
        name: tenantName,
        domain: `${tenantName.toLowerCase().replace(/\s+/g, '')}.example.com`,
        dbConnectionString: '',
        status: 'ACTIVE',
        contactPerson: name,
        email: email,
        phone: phone || null,
        address: address || null,
        gstin: gstin || null
      };

      tenant = await prisma.tenant.create({ data: tenantCreateData });
      isNewTenant = true;
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email in the tenant' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let ownerRoleId = null;
    
    if (isNewTenant) {
      // Create default roles for the new tenant
      const rolesData = [
        { name: 'Owner', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'MANAGE_USERS', 'VIEW_PROFIT'] },
        { name: 'Manager', permissions: ['CREATE_PRODUCT', 'EDIT_PRODUCT', 'VIEW_REPORTS', 'CREATE_BILL', 'VIEW_PROFIT'] },
        { name: 'Cashier', permissions: ['CREATE_BILL', 'VIEW_PRODUCT'] }
      ];

      for (const roleData of rolesData) {
        const role = await prisma.role.create({
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
    } else {
      // If tenant already exists, try to find the Owner role
      const ownerRole = await prisma.role.findFirst({
        where: { name: 'Owner', tenantId: tenant.id }
      });
      if (ownerRole) {
        ownerRoleId = ownerRole.id;
      }
    }

    // Create user
    const createUserData: any = {
      name,
      email,
      password: hashedPassword,
      tenantId: tenant.id,
      tenantRoleId: ownerRoleId,
      role: 'ADMIN' // Keeps global role as ADMIN
    };

    const user = await prisma.user.create({ data: createUserData });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userWithoutPassword,
        tenant
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