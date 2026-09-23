/**
 * cachedQuery — unified cache-then-fetch helper.
 *
 * Moved from src/lib/db/prisma.ts to keep all cache logic within
 * src/infrastructure/cache/.
 *
 * Delegates to ICache.getOrSet, which:
 * - Returns cached value if present.
 * - Calls the factory on cache miss, stores result, returns it.
 * - Does NOT cache factory errors (errors propagate without caching).
 */
import { getCache } from "@/infrastructure";
import type { ICache } from "./ICache";

export async function cachedQuery<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const cache = getCache();
  return cache.getOrSet(key, factory, ttlSeconds);
}

export type { ICache };
