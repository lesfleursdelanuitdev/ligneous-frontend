// Prisma Client Singleton
// Prevents multiple instances in development

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { dbConfig } from '@/config/database.js';

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Create PostgreSQL connection pool
  const pool = new pg.Pool({ connectionString: dbConfig.url });
  
  // Create Prisma adapter
  const adapter = new PrismaPg(pool);
  
  // Create Prisma Client with adapter
  return new PrismaClient({
    adapter,
    log: dbConfig.log,
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
