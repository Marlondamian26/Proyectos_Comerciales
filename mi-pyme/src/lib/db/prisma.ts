import { PrismaClient } from "@/generated/prisma/client";
import { getCache } from "@/infrastructure";
import path from "path";
import { fileURLToPath } from "node:url";

declare global {
  var __prisma: PrismaClient | undefined;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "..", "..", "data", "mipyme.db");

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
  const cache = getCache();
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  const result = await queryFn();
  cache.set(key, result);
  return result;
}

export default prisma;