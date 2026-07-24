import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Bearer-JWT auth for the CafeOS customer mobile app (app/api/mobile/customer/*) — a separate
// token/audience from the staff mobile app (lib/auth/mobile.ts) and from the cookie-based
// NextAuth 'customer-credentials' provider (lib/auth/nextauth.ts) used by the website. Mirrors
// lib/auth/mobile.ts's strict-secret pattern instead of the ad hoc `verifyToken()` previously
// copy-pasted into every route under app/api/mobile/customer/*.
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable is required for customer mobile authentication. Set it in your .env file.');
}
const JWT_SECRET: string = rawSecret;

export interface CustomerTokenPayload {
  id: string;
  email: string;
  role: 'CUSTOMER';
  tokenVersion: number;
}

export function signCustomerToken(payload: CustomerTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// Verifies the bearer token's signature AND that it hasn't been revoked (CustomerAccount.tokenVersion
// — bumping this on the account instantly invalidates every previously-issued token for it, e.g. on
// "log out of all devices" or a password change; the field already existed in the schema but nothing
// checked it before this). Returns the live CustomerAccount id, or null if the token is missing,
// invalid, expired, or stale relative to the account's current tokenVersion.
export async function getCustomerIdFromAuthHeader(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  let decoded: (jwt.JwtPayload & Partial<CustomerTokenPayload>) | string;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
  if (typeof decoded === 'string' || decoded.role !== 'CUSTOMER' || !decoded.id) return null;

  const account = await prisma.customerAccount.findUnique({
    where: { id: decoded.id },
    select: { tokenVersion: true },
  });
  if (!account) return null;
  if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== account.tokenVersion) return null;

  return decoded.id;
}
