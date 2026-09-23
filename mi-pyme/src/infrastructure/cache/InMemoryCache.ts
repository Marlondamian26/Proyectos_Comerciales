/**
 * InMemoryCache — the single active ICache implementation.
 *
 * Wraps `node-cache` internally. No other module outside
 * `src/infrastructure/cache/` should import `node-cache` directly.
 */
import NodeCache from "node-cache";
import { ICache } from "./ICache";

export interface InMemoryCacheOptions {
  stdTTL?: number;
  checkperiod?: number;
}

export class InMemoryCache implements ICache {
  private cache: NodeCache;

  constructor(options?: InMemoryCacheOptions) {
    this.cache = new NodeCache({
      stdTTL: options?.stdTTL ?? 600,
      checkperiod: options?.checkperiod ?? 120,
      useClones: false,
    });
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, value, ttlSeconds);
    } else {
      this.cache.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
  }

  async keys(): Promise<string[]> {
    return this.cache.keys();
  }

  /**
   * Deletes every key that starts with `prefix` and returns the count deleted.
   * Uses startsWith (not includes) to avoid accidental over-matching.
   */
  async invalidatePrefix(prefix: string): Promise<number> {
    const allKeys = this.cache.keys();
    const matching = allKeys.filter((k) => k.startsWith(prefix));
    matching.forEach((k) => this.cache.del(k));
    return matching.length;
  }

  /**
   * Returns the cached value for `key` if present; otherwise calls `factory`,
   * stores the result, and returns it. Errors from the factory are NOT cached.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== undefined) return cached;

    const result = await factory();
    if (result !== undefined) {
      if (ttlSeconds !== undefined) {
        this.cache.set(key, result, ttlSeconds);
      } else {
        this.cache.set(key, result);
      }
    }
    return result;
  }
}
