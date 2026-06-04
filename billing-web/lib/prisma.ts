import { PrismaClient } from '../generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Set it in your .env file.');
}
const connectionString = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: Pool }

let pool: Pool
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  pool = globalForPrisma.pool ?? new Pool({ connectionString, max: 5, idleTimeoutMillis: 10000 })
  const adapter = new PrismaPg(pool)
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
  globalForPrisma.pool = pool
  globalForPrisma.prisma = prisma
} else {
  pool = new Pool({ connectionString, max: 5 })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
}

export default prisma