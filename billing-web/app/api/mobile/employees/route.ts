import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getMobileUserFromAuthHeader } from '@/lib/auth/mobile';
import { corsResponse } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where: { tenantId: user.tenantId } }),
    ]);

    return corsResponse({
      employees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Mobile employees GET error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getMobileUserFromAuthHeader(request);
    if (!user || !user.tenantId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name) {
      return corsResponse({ error: 'Employee name is required' }, { status: 400 });
    }

    const employeeData: any = {
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || 'CASHIER',
      isActive: data.isActive !== undefined ? data.isActive : true,
      monthlySalesTarget: parseFloat(data.monthlySalesTarget) || 0,
      tenant: { connect: { id: user.tenantId } },
    };

    if (data.password) {
      employeeData.password = await bcrypt.hash(data.password, 10);
    }

    const employee = await prisma.employee.create({ data: employeeData });
    return corsResponse({ employee }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile employees POST error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
