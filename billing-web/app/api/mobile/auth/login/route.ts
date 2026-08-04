import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signMobileToken } from '@/lib/auth/mobile';
import { getActiveSubscription } from '@/lib/subscription';
import { corsResponse } from '@/lib/cors';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// S1: unauthenticated + previously unthrottled — brute-force guard. 10 attempts / 15 min per IP.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    // Rate limit first (counts every attempt, including invalid payloads, so an attacker can't
    // dodge the limiter by sending garbage).
    if (!checkRateLimit(`staff-login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
      return corsResponse(
        { error: 'Too many login attempts. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return corsResponse({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return corsResponse({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return corsResponse({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Same gating as the web login (lib/auth/nextauth.ts): a deactivated tenant, or a tenant
    // without a currently-valid subscription, must not be able to keep using the staff app
    // through the mobile endpoint either.
    if (!user.tenant || user.tenant.status !== 'ACTIVE') {
      return corsResponse(
        { error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      );
    }
    if (user.role !== 'SUPERADMIN') {
      const activeSub = await getActiveSubscription(user.tenantId);
      if (!activeSub) {
        return corsResponse(
          { error: "Your trial has ended and there's no active subscription on this account. Please contact your account owner or subscribe to continue." },
          { status: 403 }
        );
      }
    }

    // Generate JWT token for mobile app. tokenVersion is embedded so every subsequent request
    // (via getMobileUserFromAuthHeader) can detect a revoked token — see lib/auth/mobile.ts.
    const token = signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantRole: user.tenantRoleId,
      tokenVersion: user.tokenVersion,
    });

    return corsResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: user.tenant?.id,
        name: user.tenant?.name,
      }
    });

  } catch (error: any) {
    console.error('Mobile login error:', error);
    return corsResponse({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/cors';
