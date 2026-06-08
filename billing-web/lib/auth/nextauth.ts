import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const customer = await prisma.customerAccount.findUnique({
            where: { email: credentials.email }
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
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

      // On subsequent requests, re-fetch user/tenant to detect stale sessions
      if (token.id && token.tenantId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true, role: true, tenantRoleId: true }
          });

          const dbTenant = await prisma.tenant.findUnique({
            where: { id: token.tenantId as string },
            select: { status: true, version: true }
          });

          // If user no longer exists, force re-login
          if (!dbUser) {
            return {} as any;
          }

          // If tenant is deactivated, force re-login
          if (!dbTenant || dbTenant.status !== 'ACTIVE') {
            return {} as any;
          }

          // If user's tokenVersion changed (role/permissions updated), refresh token data
          if (dbUser.tokenVersion !== (token.tokenVersion as number)) {
            let tenantRole = null;
            if (dbUser.tenantRoleId) {
              tenantRole = await prisma.role.findUnique({
                where: { id: dbUser.tenantRoleId }
              });
            }
            token.role = dbUser.role;
            token.tenantRoleName = tenantRole?.name;
            token.permissions = tenantRole?.permissions || [];
            token.tokenVersion = dbUser.tokenVersion;
          }

          // If tenant version changed (deactivation/reactivation), refresh
          if (dbTenant.version !== (token.tenantVersion as number)) {
            token.tenantVersion = dbTenant.version;
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