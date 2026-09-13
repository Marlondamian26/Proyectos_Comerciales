/**
 * Cache module — backward compatible wrapper around infrastructure layer.
 *
 * Existing code that imports from "@/lib/cache" continues to work.
 * New code should import from "@/infrastructure" for better testability.
 */

import { getCache } from "@/infrastructure";

export function getCacheValue<T = unknown>(key: string): T | undefined {
  return getCache().get<T>(key);
}

export function setCacheValue(key: string, value: unknown): void {
  getCache().set(key, value);
}

export function delCache(key: string): void {
  getCache().del(key);
}

export function clearCache(): void {
  getCache().clear();
}

export function persistCache(): void {
  // PersistentCache auto-persists on every write
}

// Re-export for backward compatibility
export { getCache } from "@/infrastructure";