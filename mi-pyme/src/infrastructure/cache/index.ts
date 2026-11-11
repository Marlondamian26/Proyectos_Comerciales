/**
 * Cache module — single entry point for all cache operations.
 *
 * Exports the ICache interface, InMemoryCache implementation,
 * centralized key generators, TTL constants, the cachedQuery helper,
 * and the singleton accessor.
 */
export type { ICache } from "./ICache";
export { InMemoryCache } from "./InMemoryCache";
export type { InMemoryCacheOptions } from "./InMemoryCache";
export { cacheKeys, cachePrefixes, hashFiltros } from "./keys";
export { cacheTTL } from "./ttl";
export { cachedQuery } from "./cachedQuery";

import type { ICache } from "./ICache";
import { InMemoryCache } from "./InMemoryCache";

let cacheInstance: ICache | null = null;

export function getCache(): ICache {
  if (!cacheInstance) {
    cacheInstance = new InMemoryCache();
  }
  return cacheInstance;
}

export function setCacheInstance(instance: ICache): void {
  cacheInstance = instance;
}

export async function resetCache(): Promise<void> {
  if (cacheInstance) {
    await cacheInstance.clear();
  }
}
