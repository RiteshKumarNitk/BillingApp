import { PrismaClient } from '../generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Set it in your .env file.');
}
const connectionString = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: Pool }

export const pool = globalForPrisma.pool || new Pool({ connectionString, max: 5 })
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

const adapter = new PrismaPg(pool)

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma