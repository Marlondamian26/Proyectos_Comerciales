/**
 * Infrastructure layer for Mi-Pyme.
 *
 * This module abstracts external dependencies (cache, messaging) behind
 * interfaces so that services can be tested and swapped easily.
 *
 * For future microservices with Nest.js, these interfaces can be injected
 * using Nest's DI container.
 *
 * All cache logic now lives in src/infrastructure/cache/.
 * All event bus logic now lives in src/infrastructure/eventBus/.
 * This barrel re-exports everything for backward compatibility.
 */

// --- Cache ---
export type { ICache } from "./cache/ICache";
export { InMemoryCache } from "./cache/InMemoryCache";
export type { InMemoryCacheOptions } from "./cache/InMemoryCache";
export { cacheKeys, cachePrefixes, hashFiltros } from "./cache/keys";
export { cacheTTL } from "./cache/ttl";
export { cachedQuery } from "./cache/cachedQuery";
export { getCache, setCacheInstance, resetCache } from "./cache/index";

/** @deprecated Use InMemoryCache instead. Kept for backward compatibility. */
export { InMemoryCache as MemoryCache } from "./cache/InMemoryCache";

// --- Event Bus ---
export type { IEventBus, EventHandler } from "./eventBus/IEventBus";
export { InMemoryEventBus } from "./eventBus/InMemoryEventBus";
export { getEventBus, resetEventBus } from "./eventBus/index";
