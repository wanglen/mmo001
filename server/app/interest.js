import { TILE_SIZE } from '../../shared/constants.js';
import { INTEREST_RADIUS_PX, filterByInterestRadius } from '../../shared/plugins/world/interest.js';
import { filterByVisibleChunks } from '../../shared/plugins/world/chunks.js';

/**
 * @param {number} px
 * @param {number} py
 * @param {object[]} entities
 * @param {number} mapWidth
 * @param {number} mapHeight
 */
export function filterEntitiesForViewer(px, py, entities, mapWidth, mapHeight) {
  const inRange = filterByInterestRadius(px, py, entities, INTEREST_RADIUS_PX);
  return filterByVisibleChunks(
    inRange,
    px,
    py,
    TILE_SIZE,
    mapWidth,
    mapHeight
  );
}
