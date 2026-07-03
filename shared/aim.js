/**
 * Compute 4-way facing direction from a delta vector.
 * @returns {'up'|'down'|'left'|'right'|null}
 */
export function directionFromDelta(dx, dy) {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/**
 * Compute facing direction from player position toward a world target.
 * @returns {'up'|'down'|'left'|'right'|null}
 */
export function facingFromTarget(playerX, playerY, targetX, targetY) {
  return directionFromDelta(targetX - playerX, targetY - playerY);
}

/**
 * Aim angle in radians from player toward target (-PI to PI).
 */
export function aimAngleFromTarget(playerX, playerY, targetX, targetY) {
  return Math.atan2(targetY - playerY, targetX - playerX);
}
