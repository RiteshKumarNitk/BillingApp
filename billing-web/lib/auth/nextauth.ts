import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('[NEXTAUTH] Authorizing email:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('[NEXTAUTH] Missing credentials');
          return null;
        }

        try {
          // Find the user by email (globally unique)
          console.log('[NEXTAUTH] Finding user with email:', credentials.email);
          const user = await (prisma as any).user.findUnique({
            where: {
              email: credentials.email,
            }
          });
          console.log('[NEXTAUTH] Found user:', !!user ? user.id : 'null');

          if (!user) {
            console.log('[NEXTAUTH] Returning null because user not found');
            return null;
          }

          // Ensure the tenant exists and is active
          console.log('[NEXTAUTH] Finding tenant with id:', user.tenantId);
          const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
          });
          console.log('[NEXTAUTH] Found tenant:', !!tenant ? tenant.id : 'null', 'status:', tenant?.status);

          if (!tenant || tenant.status !== 'ACTIVE') {
            console.log('[NEXTAUTH] Returning null because tenant inactive/missing');
            return null;
          }

          // Fetch tenant role separately if tenantRoleId exists
          let tenantRole = null;
          if (user.tenantRoleId) {
            console.log('[NEXTAUTH] Finding tenant role with id:', user.tenantRoleId);
            tenantRole = await prisma.role.findUnique({
              where: { id: user.tenantRoleId }
            });
            console.log('[NEXTAUTH] Found tenant role:', !!tenantRole ? tenantRole.id : 'null');
          }

          // Check password
          console.log('[NEXTAUTH] Comparing password for user:', user.id);
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          console.log('[NEXTAUTH] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[NEXTAUTH] Returning null because password invalid');
            return null;
          }

          console.log('[NEXTAUTH] Returning user object for nextauth');
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
      console.log('[NEXTAUTH] JWT callback - user:', user ? user.id : 'null');
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.tenantRoleName = user.tenantRoleName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NEXTAUTH] Session callback - token:', token ? token.id : 'null');
      if (token) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
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