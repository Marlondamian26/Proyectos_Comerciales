/**
 * Cache Interface — the single source of truth for all cache operations in Mi-Pyme.
 *
 * The interface is intentionally asynchronous to allow future migration to
 * a distributed cache (e.g. Redis) without changing consumer code.
 *
 * Implementation: `InMemoryCache` (node-cache backed) in this same package.
 */
export interface ICache {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  invalidatePrefix(prefix: string): Promise<number>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
