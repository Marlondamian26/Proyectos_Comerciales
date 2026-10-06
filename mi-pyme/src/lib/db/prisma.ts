import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL!;

  if (rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://")) {
    const connectionString = rawUrl
      .replace(/[?&]sslmode=verify-full/, "")
      .replace(/[?&]sslmode=require/, "");

    const adapter = new PrismaPg({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { cachedQuery } from "@/infrastructure";

export default prisma;
