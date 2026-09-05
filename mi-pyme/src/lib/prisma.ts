import { PrismaClient } from "@prisma/client";
import { getCache, setCache } from "./cache";

const prisma = new PrismaClient();

export async function cachedQuery<T = any>(key: string, queryFn: () => Promise<T>): Promise<T> {
  const cached = getCache<T>(key);
  if (cached) return cached;

  const result = await queryFn();
  setCache(key, result);
  return result;
}

export default prisma;
