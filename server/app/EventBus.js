/**
 * Synchronous in-process event bus for server domain events.
 */
export function createEventBus() {
  /** @type {Map<string, Set<(payload: unknown) => void>>} */
  const handlers = new Map();

  return {
    /**
     * @param {string} event
     * @param {(payload: unknown) => void} handler
     * @returns {() => void} unsubscribe
     */
    on(event, handler) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event).add(handler);
      return () => handlers.get(event)?.delete(handler);
    },

    /** @param {string} event @param {unknown} payload */
    emit(event, payload) {
      const listeners = handlers.get(event);
      if (!listeners) return;
      for (const handler of listeners) {
        handler(payload);
      }
    },

    /** @param {string} event @returns {number} */
    listenerCount(event) {
      return handlers.get(event)?.size ?? 0;
    },

    clear() {
      handlers.clear();
    },
  };
}
