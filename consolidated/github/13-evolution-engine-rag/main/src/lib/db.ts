// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

interface GlobalWithPrisma extends GlobalThis {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as GlobalWithPrisma;

const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query'],
  });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}