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

    // Generate a unique domain to avoid conflicts
    const baseDomain = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const domain = `${baseDomain}-${uniqueSuffix}.example.com`;

    const tenantCreateData: any = {
      name: tenantName,
      domain: domain,
      dbConnectionString: '',
      status: 'ACTIVE',
      contactPerson: name,
      email: email,
      phone: phone || null,
      address: address || null,
      gstin: gstin || null,
      subscriptionPlan: 'FREE'
    };

    const tenant = await prisma.tenant.create({ data: tenantCreateData });

    // Check if user already exists (globally by email)
    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let ownerRoleId = null;
    
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