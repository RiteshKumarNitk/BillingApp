import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      tenantId: string
      role: string
      tenantRoleName?: string
      permissions?: string[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    tenantId: string
    role: string
    tenantRoleName?: string
    permissions?: string[]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string
    tenantId: string
    role: string
    tenantRoleName?: string
    permissions?: string[]
    tokenVersion?: number
    tenantVersion?: number
  }
}
