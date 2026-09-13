/**
 * Infrastructure layer for Mi-Pyme.
 *
 * This module abstracts external dependencies (database, cache, messaging)
 * behind interfaces so that services can be tested and swapped easily.
 *
 * For future microservices with Nest.js, these interfaces can be injected
 * using Nest's DI container.
 */

import NodeCache from "node-cache";

// ---------------------------------------------------------------------------
// Cache Interface
// ---------------------------------------------------------------------------

export interface ICache {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown, ttl?: number): boolean;
  del(key: string): number;
  clear(): void;
  keys(): string[];
}

export class MemoryCache implements ICache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
      useClones: false,
    });
  }

  get<T = unknown>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set(key: string, value: unknown, ttl?: number): boolean {
    return this.cache.set(key, value, ttl as string | number);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }

  keys(): string[] {
    return this.cache.keys();
  }
}

// ---------------------------------------------------------------------------
// Event Bus Interface (for future microservices)
// ---------------------------------------------------------------------------

export interface EventHandler<T = unknown> {
  handle(event: T): Promise<void> | void;
}

export interface IEventBus {
  publish<T = unknown>(event: string, payload: T): Promise<void>;
  subscribe<T = unknown>(event: string, handler: EventHandler<T>): void;
  unsubscribe<T = unknown>(event: string, handler: EventHandler<T>): void;
}

export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish<T = unknown>(event: string, payload: T): Promise<void> {
    const eventHandlers = this.handlers.get(event) || [];
    for (const handler of eventHandlers) {
      await handler.handle(payload);
    }
  }

  subscribe<T = unknown>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(event, existing);
  }

  unsubscribe<T = unknown>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) || [];
    const index = existing.indexOf(handler as EventHandler);
    if (index > -1) {
      existing.splice(index, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instances
// ---------------------------------------------------------------------------

let cacheInstance: ICache | null = null;
let eventBusInstance: IEventBus | null = null;

export function getCache(): ICache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}

export function getEventBus(): IEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new InMemoryEventBus();
  }
  return eventBusInstance;
}

export function resetCache(): void {
  cacheInstance = null;
}

export function resetEventBus(): void {
  eventBusInstance = null;
}