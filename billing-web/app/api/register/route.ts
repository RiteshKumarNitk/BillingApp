import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createDefaultRoles, seedTenantWorkspaceDefaults } from '@/lib/tenantOnboarding';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendEmail, EmailTemplates } from '@/lib/mail';
import { SITE_URL } from '@/lib/marketing/seo';

// S1: public, unauthenticated tenant signup — each call creates a tenant + roles + shop + website,
// so throttle it harder than customer signup. 5 registrations / hour per IP.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(`tenant-register:${getClientIp(request)}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
      return NextResponse.json(
        { error: 'Too many sign-up attempts from this device. Please try again later.' },
        { status: 429 }
      );
    }

    const { name, email: rawEmail, password, tenantName, phone, address, gstin, businessType } = await request.json();
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;

    const VALID_BUSINESS_TYPES = ['CAFE', 'LAUNDRY', 'SALON'];
    const normalizedBusinessType = VALID_BUSINESS_TYPES.includes(businessType) ? businessType : null;

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

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
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
          status: 'PENDING',
          contactPerson: name,
          email,
          phone: phone || null,
          address: address || null,
          gstin: gstin || null,
          subscriptionPlan: 'Starter',
          businessType: normalizedBusinessType,
        }
      });

      const ownerRoleId = await createDefaultRoles(tx, tenant.id);
      await seedTenantWorkspaceDefaults(tx, tenant);

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

    // B6: alert every superadmin that a PENDING tenant is waiting for approval. Fire-and-forget —
    // a mailer failure must never fail the signup itself (sendEmail already logs and swallows).
    prisma.user
      .findMany({ where: { role: 'SUPERADMIN' }, select: { email: true } })
      .then((admins) =>
        Promise.all(
          admins.map((admin) =>
            sendEmail({
              to: admin.email,
              subject: `New signup awaiting approval: ${result.tenant.name}`,
              html: EmailTemplates.TenantPendingApproval(result.tenant.name, name, email, `${SITE_URL}/tenants?status=PENDING`),
            })
          )
        )
      )
      .catch((err) => console.error('Failed to notify superadmins of new signup:', err));

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