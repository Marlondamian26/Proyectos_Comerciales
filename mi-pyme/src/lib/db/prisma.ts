import { PrismaClient } from "@/generated/prisma/client";
import { getCache, setCache } from "@/lib/cache";
import path from "path";

declare global {
  var __prisma: PrismaClient | undefined;
}

const dbPath = path.join(process.cwd(), "data", "mipyme.db");

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });
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

export async function cachedQuery<T = unknown>(key: string, queryFn: () => Promise<T>): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== undefined) return cached;

  const result = await queryFn();
  setCache(key, result);
  return result;
}

export default prisma;
