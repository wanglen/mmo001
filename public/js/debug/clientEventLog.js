/** @typedef {(payload: object) => void} DebugSender */

let active = false;
/** @type {DebugSender | null} */
let sender = null;

/** @type {Map<string, { lastAt: number }>} */
const throttleState = new Map();

/**
 * @param {{ active?: boolean, send?: DebugSender }} options
 */
export function configureClientEventLog({ active: nextActive = false, send = null } = {}) {
  active = nextActive;
  sender = send;
  if (!nextActive) throttleState.clear();
}

export function isClientEventLogActive() {
  return active;
}

/**
 * @param {string} type
 * @param {object} [data]
 * @param {{ throttleMs?: number, throttleKey?: string }} [options]
 */
export function logClientGameEvent(type, data = {}, { throttleMs = 0, throttleKey = null } = {}) {
  if (!active) return;

  const key = throttleKey ?? (throttleMs > 0 ? `${type}:${JSON.stringify(data)}` : null);
  if (throttleMs > 0 && key) {
    const now = Date.now();
    const prev = throttleState.get(key);
    if (prev && now - prev.lastAt < throttleMs) return;
    throttleState.set(key, { lastAt: now });
  }

  const payload = { type, ...data };
  console.debug('[mmo debug]', payload);
  sender?.(payload);
}

/**
 * @param {import('../game/Game.js').Game} game
 * @param {object} map
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {string} context
 */
export function trySetPath(game, map, fromX, fromY, toX, toY, context) {
  const result = game.pathFollower.setPath(map, fromX, fromY, toX, toY);
  if (!result.ok) {
    logClientGameEvent(
      'path_failed',
      {
        context,
        reason: result.reason,
        mapId: map?.mapId ?? null,
        fromX,
        fromY,
        toX,
        toY,
      },
      { throttleMs: 2000, throttleKey: `path_failed:${context}:${result.reason}` }
    );
  }
  return result;
}
