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
        console.log('Authorizing email:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        // Find the user by email (globally unique)
        const user = await (prisma as any).user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            tenantRole: true
          }
        });
        console.log('Found user:', !!user);

        if (!user) {
          console.log('Returning null because user not found');
          return null;
        }

        // Ensure the tenant exists and is active
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.tenantId }
        });
        console.log('Found tenant:', !!tenant, 'status:', tenant?.status);

        if (!tenant || tenant.status !== 'ACTIVE') {
          console.log('Returning null because tenant inactive/missing');
          return null;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('Returning null because password invalid');
          return null;
        }

        console.log('Returning user object for nextauth');
        // Return user object with tenantId, role, and RBAC permissions
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantRoleName: user.tenantRole?.name,
          permissions: user.tenantRole?.permissions || []
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  callbacks: {
    async jwt({ token, user }) {
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