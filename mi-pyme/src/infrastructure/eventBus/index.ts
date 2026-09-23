export type { IEventBus, EventHandler } from "./IEventBus";
export { InMemoryEventBus } from "./InMemoryEventBus";

import type { IEventBus } from "./IEventBus";
import { InMemoryEventBus } from "./InMemoryEventBus";

let eventBusInstance: IEventBus | null = null;

export function getEventBus(): IEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new InMemoryEventBus();
  }
  return eventBusInstance;
}

export function resetEventBus(): void {
  eventBusInstance = null;
}
