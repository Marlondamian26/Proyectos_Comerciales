/**
 * InMemoryEventBus — the single active IEventBus implementation.
 */
import { IEventBus, EventHandler } from "./IEventBus";

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
