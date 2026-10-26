import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getActiveSubscription } from "@/lib/subscription";
import { checkRateLimit, clientIpFromHeaderValues } from "@/lib/rateLimit";

const NO_SUBSCRIPTION_ERROR = "Your trial has ended and there's no active subscription on this account. Please contact your account owner or subscribe to continue.";
const TOO_MANY_ATTEMPTS_ERROR = "Too many login attempts. Please try again in a few minutes.";

// S1: web login brute-force guard, same budget as the mobile login routes (10 attempts / 15 min),
// applied per IP and per target email so neither a single attacker nor distributed guessing
// against one account gets a free budget.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function isLoginThrottled(scope: string, email: string, headers: Record<string, any> | undefined): boolean {
  const header = (name: string): string | undefined => {
    const value = headers?.[name];
    return typeof value === "string" ? value : Array.isArray(value) ? value.join(",") : undefined;
  };
  const ip = clientIpFromHeaderValues(header("x-forwarded-for"), header("x-real-ip"));
  const ipOk = checkRateLimit(`${scope}-ip:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  const emailOk = checkRateLimit(`${scope}-email:${email.toLowerCase().trim()}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  return !ipOk || !emailOk;
}

// P1: the jwt callback runs on every getServerSession() call and used to do 2–3 DB queries each
// time (user + tenant + subscription). Cache the result per user for a short TTL — revocation
// (deleted user, deactivated tenant, lapsed subscription, role change) now takes effect within
// SESSION_CHECK_TTL_MS instead of instantly, and actions that change those in this process call
// clearSessionStateCache() so the common case is still immediate.
const SESSION_CHECK_TTL_MS = 30 * 1000;
type SessionState = {
  tokenVersion: number;
  role: string;
  tenantRoleId: string | null;
  tenantVersion: number;
  // false = force re-login (user deleted, tenant inactive, or no active subscription)
  valid: boolean;
};
const sessionStateCache = new Map<string, { state: SessionState; checkedAt: number }>();

export function clearSessionStateCache() {
  sessionStateCache.clear();
}

async function loadSessionState(userId: string, tenantId: string): Promise<SessionState> {
  const now = Date.now();
  const cached = sessionStateCache.get(userId);
  if (cached && now - cached.checkedAt < SESSION_CHECK_TTL_MS) return cached.state;

  const [dbUser, dbTenant] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { tokenVersion: true, role: true, tenantRoleId: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { status: true, version: true } }),
  ]);

  let valid = !!dbUser && !!dbTenant && dbTenant.status === 'ACTIVE';
  // Same subscription check as authorize() — re-run on refresh so a session opened while a trial
  // was still valid gets kicked out once it lapses mid-session, rather than only blocking new logins.
  if (valid && dbUser!.role !== 'SUPERADMIN') {
    valid = !!(await getActiveSubscription(tenantId));
  }

  const state: SessionState = {
    tokenVersion: dbUser?.tokenVersion ?? 0,
    role: dbUser?.role ?? '',
    tenantRoleId: dbUser?.tenantRoleId ?? null,
    tenantVersion: dbTenant?.version ?? 0,
    valid,
  };

  if (sessionStateCache.size > 5000) {
    for (const [key, entry] of sessionStateCache) {
      if (now - entry.checkedAt >= SESSION_CHECK_TTL_MS) sessionStateCache.delete(key);
    }
  }
  sessionStateCache.set(userId, { state, checkedAt: now });
  return state;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Customer auth provider
    CredentialsProvider({
      id: "customer-credentials",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (isLoginThrottled("web-customer-login", credentials.email, req?.headers)) {
          throw new Error(TOO_MANY_ATTEMPTS_ERROR);
        }
        try {
          // Customer accounts are always stored lowercased (see the register routes).
          const customer = await prisma.customerAccount.findUnique({
            where: { email: credentials.email.toLowerCase().trim() }
          });
          if (!customer) return null;

          const isValid = await bcrypt.compare(credentials.password, customer.password);
          if (!isValid) return null;

          return {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            role: "CUSTOMER" as any,
            tenantId: "",
          };
        } catch (error) {
          console.error('[NEXTAUTH] Customer auth error:', error);
          return null;
        }
      }
    }),
    // Admin/Tenant auth provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (isLoginThrottled("web-staff-login", credentials.email, req?.headers)) {
          throw new Error(TOO_MANY_ATTEMPTS_ERROR);
        }

        try {
          // Find the user by email (globally unique)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            }
          });

          if (!user) {
            return null;
          }

          // Ensure the tenant exists and is active
          const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
          });

          if (!tenant || tenant.status !== 'ACTIVE') {
            return null;
          }

          // Fetch tenant role separately if tenantRoleId exists
          let tenantRole = null;
          if (user.tenantRoleId) {
            tenantRole = await prisma.role.findUnique({
              where: { id: user.tenantRoleId }
            });
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Superadmin operates the platform itself and isn't gated by a tenant subscription.
          // Every other login requires a currently-valid (ACTIVE/TRIAL/PAST_DUE, unexpired)
          // subscription — a lapsed trial or a tenant that never subscribed shouldn't be able to
          // keep using the app indefinitely just because their account still exists.
          if (user.role !== "SUPERADMIN") {
            const activeSub = await getActiveSubscription(tenant.id);
            if (!activeSub) {
              throw new Error(NO_SUBSCRIPTION_ERROR);
            }
          }

          // Return user object with tenantId, role, and RBAC permissions
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenantRoleName: tenantRole?.name,
            permissions: tenantRole?.permissions || []
          };
        } catch (error) {
          console.error('[NEXTAUTH] Error during authorization:', error);
          // Re-throw the subscription-required error so its specific message reaches the login
          // page instead of being swallowed into the generic "CredentialsSignin" that a bare
          // `return null` produces for every other failure below.
          if (error instanceof Error && error.message === NO_SUBSCRIPTION_ERROR) {
            throw error;
          }
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, populate token from the authorize response
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.tenantRoleName = user.tenantRoleName;
        token.permissions = user.permissions;
        token.tokenVersion = 0;
        token.tenantVersion = 0;
      }

      // Handle customer tokens - no DB refresh needed
      if (token.role === 'CUSTOMER') {
        return token;
      }

      // On subsequent requests, re-validate user/tenant/subscription (cached briefly, see P1 above)
      // to detect stale sessions
      if (token.id && token.tenantId) {
        try {
          const state = await loadSessionState(token.id as string, token.tenantId as string);

          // User deleted, tenant deactivated, or no active subscription → force re-login
          if (!state.valid) {
            return {} as any;
          }

          // If user's tokenVersion changed (role/permissions updated), refresh token data
          if (state.tokenVersion !== (token.tokenVersion as number)) {
            let tenantRole = null;
            if (state.tenantRoleId) {
              tenantRole = await prisma.role.findUnique({
                where: { id: state.tenantRoleId }
              });
            }
            token.role = state.role;
            token.tenantRoleName = tenantRole?.name;
            token.permissions = tenantRole?.permissions || [];
            token.tokenVersion = state.tokenVersion;
          }

          // If tenant version changed (deactivation/reactivation), refresh
          if (state.tenantVersion !== (token.tenantVersion as number)) {
            token.tenantVersion = state.tenantVersion;
          }
        } catch (error) {
          console.error('[NEXTAUTH] Error refreshing token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.tenantId = (token.tenantId as string) || '';
        session.user.role = token.role as string;
        session.user.tenantRoleName = token.tenantRoleName as string | undefined;
        session.user.permissions = token.permissions as string[] | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login"
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };