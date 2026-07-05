export const MONSTER_SPRITE_SIZE = 16;

export const MONSTER_ANIM = {
  IDLE: 0,
  WALK: 1,
};

/**
 * Pick atlas column from movement state and toggled walk frame.
 * @param {boolean} moving
 * @param {number} walkFrame - 0 or 1
 */
export function resolveMonsterWalkFrame(moving, walkFrame) {
  if (!moving) return MONSTER_ANIM.IDLE;
  return walkFrame === 1 ? MONSTER_ANIM.WALK : MONSTER_ANIM.IDLE;
}

/**
 * Infer facing from position delta between server updates.
 * @param {number|null} prevX
 * @param {number|null} prevY
 * @param {number} x
 * @param {number} y
 */
export function inferMonsterFacing(prevX, prevY, x, y) {
  if (prevX == null || prevY == null) return 'down';

  const dx = x - prevX;
  const dy = y - prevY;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return 'down';
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
