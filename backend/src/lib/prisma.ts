import { PrismaClient } from "@prisma/client";
import { env } from "../config.ts";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "production" ? ["warn", "error"] : ["query"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
