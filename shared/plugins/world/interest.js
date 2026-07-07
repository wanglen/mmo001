/** Radius around the viewer for syncing monsters, loot, and remote players. */
export const INTEREST_RADIUS_PX = 720;

/**
 * @param {number} cx
 * @param {number} cy
 * @param {{ x: number, y: number }} entity
 * @param {number} radius
 */
export function isWithinInterestRadius(cx, cy, entity, radius) {
  const dx = entity.x - cx;
  const dy = entity.y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * @template {{ x: number, y: number }} T
 * @param {number} cx
 * @param {number} cy
 * @param {T[]} entities
 * @param {number} [radius]
 * @returns {T[]}
 */
export function filterByInterestRadius(cx, cy, entities, radius = INTEREST_RADIUS_PX) {
  if (!Array.isArray(entities) || entities.length === 0) return [];
  return entities.filter((entity) => isWithinInterestRadius(cx, cy, entity, radius));
}
