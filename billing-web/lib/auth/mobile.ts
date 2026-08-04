import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable is required for mobile authentication. Set it in your .env file.');
}
const JWT_SECRET: string = rawSecret;

export function signMobileToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyMobileToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export interface StaffMobileUser {
  id: string;
  email?: string;
  name?: string;
  // Authoritative values from the live DB row, not the token's claims — a role change or tenant
  // change takes effect on the next request, and a deleted user or a bumped tokenVersion
  // (password change / forced logout) revokes access immediately instead of riding out the
  // token's 30-day life.
  role: string;
  tenantId: string;
  tenantRole: string | null;
  tokenVersion: number;
}

// Verifies the bearer token's signature AND that the issuing staff user still exists with an
// unrevoked tokenVersion — mirrors lib/auth/customer-mobile.ts's getCustomerIdFromAuthHeader so
// staff sessions have the same revocation semantics customer sessions already do. Returns the
// user's authoritative id/role/tenantId from the database, or null if the token is missing,
// invalid, expired, or stale relative to the user's current tokenVersion.
export async function getMobileUserFromAuthHeader(request: Request): Promise<StaffMobileUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyMobileToken(token);
  if (!decoded || typeof decoded === 'string' || !decoded.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id as string },
    select: { id: true, role: true, tenantId: true, tenantRoleId: true, tokenVersion: true },
  });
  if (!user) return null;
  if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== user.tokenVersion) return null;

  return {
    id: user.id,
    email: (decoded as JwtPayload).email as string | undefined,
    name: (decoded as JwtPayload).name as string | undefined,
    role: user.role,
    tenantId: user.tenantId,
    tenantRole: user.tenantRoleId,
    tokenVersion: user.tokenVersion,
  };
}
