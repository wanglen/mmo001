import { isTileInZone } from './zones.js';

/** How many tiles around the player are permanently revealed while exploring. */
export const FOG_REVEAL_RADIUS_TILES = 10;

/** Unexplored terrain veil — translucent grey; drawn over map tiles only. */
export const FOG_HIDDEN_COLOR = 'rgba(88, 92, 102, 0.62)';

/** Opaque fill for viewport outside the world bounds. */
export const FOG_VOID_COLOR = '#0c0e14';

export function tileKey(tileX, tileY) {
  return `${tileX},${tileY}`;
}

export function parseTileKey(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function isTileRevealed(revealed, tileX, tileY) {
  return revealed.has(tileKey(tileX, tileY));
}

export function isPositionRevealed(revealed, pixelX, pixelY, tileSize) {
  const tileX = Math.floor(pixelX / tileSize);
  const tileY = Math.floor(pixelY / tileSize);
  return isTileRevealed(revealed, tileX, tileY);
}

/** Drop entities whose foot tile is still under fog. */
export function filterRevealedPositions(revealed, entities, tileSize) {
  if (!revealed) return entities;
  return entities.filter((entity) => isPositionRevealed(revealed, entity.x, entity.y, tileSize));
}

/** Permanently reveal tiles near the player as they explore. */
export function revealTilesInRadius(revealed, centerTileX, centerTileY, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.hypot(dx, dy) <= radius + 0.5) {
        revealed.add(tileKey(centerTileX + dx, centerTileY + dy));
      }
    }
  }
}

/** Pre-reveal safe town zones so spawn area is never black. */
export function revealTownZones(revealed, map) {
  for (const zone of map.zones ?? []) {
    if (!zone.safe) continue;
    for (let dy = -zone.radius; dy <= zone.radius; dy++) {
      for (let dx = -zone.radius; dx <= zone.radius; dx++) {
        const tx = zone.center.x + dx;
        const ty = zone.center.y + dy;
        if (isTileInZone(zone, tx, ty)) {
          revealed.add(tileKey(tx, ty));
        }
      }
    }
  }
}
