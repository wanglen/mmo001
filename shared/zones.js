import { TILE_SIZE } from './constants.js';

/** Zone identifiers — used by map data and future zone systems. */
export const ZONE_ID = {
  TOWN: 'town',
};

/** Fixed town radius — small hub around spawn, not scaled to map size. */
export const TOWN_RADIUS_TILES = 4;

/** @deprecated Use TOWN_RADIUS_TILES */
export const SPAWN_SAFE_RADIUS_TILES = TOWN_RADIUS_TILES;

/** Town safe-area radius in tiles. */
export function spawnSafeRadiusTiles(_mapWidth = 40) {
  return TOWN_RADIUS_TILES;
}

export function townRadiusTiles(_mapWidth = 40) {
  return TOWN_RADIUS_TILES;
}

/**
 * @param {{ x: number, y: number }} spawn — tile coordinates
 * @param {number} mapWidth
 */
export function createTownZone(spawn, mapWidth) {
  return {
    id: ZONE_ID.TOWN,
    label: 'Town',
    safe: true,
    center: { x: spawn.x, y: spawn.y },
    radius: townRadiusTiles(mapWidth),
  };
}

/** @deprecated Use createTownZone */
export function createSpawnSafeZone(spawn, mapWidth) {
  return createTownZone(spawn, mapWidth);
}

/** Chebyshev distance — square safe area aligned to the tile grid. */
export function isTileInZone(zone, tileX, tileY) {
  const dx = Math.abs(tileX - zone.center.x);
  const dy = Math.abs(tileY - zone.center.y);
  return Math.max(dx, dy) <= zone.radius;
}

export function isTileInAnySafeZone(map, tileX, tileY) {
  for (const zone of map.zones ?? []) {
    if (zone.safe && isTileInZone(zone, tileX, tileY)) return true;
  }
  return false;
}

export function isInSafeZone(map, pixelX, pixelY) {
  const tileX = Math.floor(pixelX / TILE_SIZE);
  const tileY = Math.floor(pixelY / TILE_SIZE);
  return isTileInAnySafeZone(map, tileX, tileY);
}
