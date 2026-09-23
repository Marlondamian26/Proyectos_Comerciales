/**
 * Event Bus Interface — for future pub/sub event handling.
 *
 * Not currently used in production but part of the infrastructure layer
 * for future microservices migration.
 */

export interface EventHandler<T = unknown> {
  handle(event: T): Promise<void> | void;
}

export interface IEventBus {
  publish<T = unknown>(event: string, payload: T): Promise<void>;
  subscribe<T = unknown>(event: string, handler: EventHandler<T>): void;
  unsubscribe<T = unknown>(event: string, handler: EventHandler<T>): void;
}
