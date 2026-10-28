import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export interface StaffSession {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

// Resolves the logged-in staff user for API route handlers.
//
// Use this instead of next-auth's `getToken()`: getToken only decodes the session cookie and never
// runs the `jwt` callback in lib/auth/nextauth.ts, so it skipped every revocation check — a deleted
// user, a deactivated tenant, a lapsed subscription, or a role change all kept working for the
// cookie's full 30-day life. getServerSession runs that callback (cached ~30s, see P1 there), and
// an invalidated session comes back without a user id.
export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id || !user.tenantId || user.role === "CUSTOMER") return null;
  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    permissions: user.permissions || [],
  };
}
