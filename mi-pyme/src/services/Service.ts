/**
 * Service base class for Mi-Pyme business logic.
 *
 * Services encapsulate business rules and orchestrate infrastructure
 * (database, cache, external APIs). They are framework-agnostic and
 * can be reused by Server Actions, API Routes, or future Nest.js services.
 */
export abstract class Service {
  async init(): Promise<void> {
    // No-op by default
  }

  async destroy(): Promise<void> {
    // No-op by default
  }
}