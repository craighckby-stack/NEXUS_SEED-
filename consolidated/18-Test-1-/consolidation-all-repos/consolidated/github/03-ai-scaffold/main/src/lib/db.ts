// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

/**
 * Type definition for the global object with an optional Prisma client instance.
 */
type GlobalPrisma = {
  prisma?: PrismaClient;
} & typeof globalThis;

// Assert the global scope with the Prisma client type
const { prisma, ...globalRest } = globalThis as GlobalPrisma;

// Initialize the Prisma client instance, reusing the global instance if it exists
const db = globalContext.prisma ?? new PrismaClient();

// Store the instantiated client on the global object when not in production
if (process.env.NODE_ENV !== 'production') {
  globalContext.prisma = db;
}

// Export the Prisma client instance
export default db;
```

**