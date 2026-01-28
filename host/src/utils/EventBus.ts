import type { AuthEvent, AuthEventHandler, AuthEventType } from '@mfe/shared';

class AuthEventBus {
  private listeners: Map<AuthEventType, Set<AuthEventHandler>> = new Map();

  subscribe(eventType: AuthEventType, handler: AuthEventHandler): () => void {
    const handlers = this.listeners.get(eventType) ?? new Set<AuthEventHandler>();
    handlers.add(handler);
    this.listeners.set(eventType, handlers);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  emit(event: AuthEvent): void {
    const handlers = this.listeners.get(event.type);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(event));
  }
}

export const authEventBus = new AuthEventBus();
