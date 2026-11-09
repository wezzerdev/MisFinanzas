import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClientV2: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prismaClientV2 ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClientV2 = prisma;
}

export default prisma;
