import { DIRECTION_DELTA } from '../../movement.js';
import { MOVE_SPEED } from '../../constants.js';

/** Minimum ms between accepted move packets (client sends ~50ms). */
export const MIN_MOVE_INTERVAL_MS = 35;

/** Allow small clock skew and burst tolerance. */
export const MAX_MOVE_SPEED_MULTIPLIER = 1.15;

/**
 * @param {object} player
 * @param {string} direction
 * @param {number} now
 * @returns {{ ok: true, delta: { x: number, y: number } } | { ok: false, reason: string }}
 */
export function validatePlayerMove(player, direction, now = Date.now()) {
  const delta = DIRECTION_DELTA[direction];
  if (!delta) return { ok: false, reason: 'invalid_direction' };

  const lastMoveAt = player.lastMoveAt ?? 0;
  const elapsed = now - lastMoveAt;
  if (lastMoveAt > 0 && elapsed < MIN_MOVE_INTERVAL_MS) {
    return { ok: false, reason: 'rate_limit' };
  }

  const step = Math.hypot(delta.x, delta.y);
  const maxStep = MOVE_SPEED * MAX_MOVE_SPEED_MULTIPLIER;
  if (step > maxStep + 0.01) {
    return { ok: false, reason: 'speed' };
  }

  return { ok: true, delta };
}

/**
 * Reject loot claims when the player is impossibly far from the drop.
 * @param {number} playerX
 * @param {number} playerY
 * @param {number} dropX
 * @param {number} dropY
 * @param {number} pickupRange
 * @param {number} [tolerance]
 */
export function isLootPickupInRange(playerX, playerY, dropX, dropY, pickupRange, tolerance = 4) {
  const dx = playerX - dropX;
  const dy = playerY - dropY;
  const distSq = dx * dx + dy * dy;
  const max = pickupRange + tolerance;
  return distSq <= max * max;
}
