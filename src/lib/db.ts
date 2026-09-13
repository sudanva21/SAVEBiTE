// ==============================================
// SaveByte — Database Client (Prisma + Neon)
// ==============================================
//
// Native PostgreSQL Prisma Client connecting directly
// to Neon PostgreSQL (pooled connection).
//
// NOTE: Do NOT import this in client components.
// This module is server-only.
//

import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    transactionOptions: {
      maxWait: 15000,
      timeout: 30000,
    },
  });

export const db = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    if (prop === 'aiInsight') {
      return (target as any).aIInsight ?? (target as any).aiInsight;
    }
    return Reflect.get(target, prop, receiver);
  },
}) as PrismaClient & { aiInsight: any };

export const prisma = db;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = rawPrisma;
}
