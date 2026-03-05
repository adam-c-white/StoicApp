/**
 * Prisma Client singleton for use across the application.
 *
 * In development, Next.js hot-reloading can cause multiple Prisma Client
 * instances to be created. We cache the client on `globalThis` to avoid
 * exhausting database connections.
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
