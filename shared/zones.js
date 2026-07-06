import { TILE_SIZE } from './constants.js';
import { BOSS_ROOM_META, BOSS_ROOM_ZONE_ID } from './dungeon.js';
import { isTownHubMap } from './townHub.js';

/** Zone identifiers — used by map data and future zone systems. */
export const ZONE_ID = {
  TOWN: 'town',
  WILDERNESS: 'wilderness',
  DUNGEON: 'dungeon',
};

export const ZONE_META = {
  [ZONE_ID.TOWN]: { label: 'Town', color: '#87ceeb' },
  [ZONE_ID.WILDERNESS]: { label: 'Wilderness', color: '#a8d5a2' },
  [ZONE_ID.DUNGEON]: { label: 'Dungeon', color: '#b088f9' },
};

/** Fixed town radius — small hub around spawn, not scaled to map size. */
export const TOWN_RADIUS_TILES = 4;

/** Dungeon pocket radius on the wilderness map. */
export const DUNGEON_RADIUS_TILES = 5;

/** Extra dungeon-only spawns as a fraction of base population. */
export const DUNGEON_EXTRA_SPAWN_RATIO = 0.35;

/** @deprecated Use TOWN_RADIUS_TILES */
export const SPAWN_SAFE_RADIUS_TILES = TOWN_RADIUS_TILES;

export function townRadiusTiles(_mapWidth = 40) {
  return TOWN_RADIUS_TILES;
}

export function spawnSafeRadiusTiles(_mapWidth = 40) {
  return TOWN_RADIUS_TILES;
}

export function dungeonSpawnBonus(baseCount) {
  return Math.floor(baseCount * DUNGEON_EXTRA_SPAWN_RATIO);
}

export function totalSpawnTarget(baseCount) {
  return baseCount + dungeonSpawnBonus(baseCount);
}

/**
 * @param {{ x: number, y: number }} spawn — tile coordinates
 * @param {number} mapWidth
 */
export function createTownZone(spawn, mapWidth) {
  return {
    id: ZONE_ID.TOWN,
    label: ZONE_META[ZONE_ID.TOWN].label,
    safe: true,
    center: { x: spawn.x, y: spawn.y },
    radius: townRadiusTiles(mapWidth),
  };
}

/** @deprecated Use createTownZone */
export function createSpawnSafeZone(spawn, mapWidth) {
  return createTownZone(spawn, mapWidth);
}

export function createDungeonZone(center, radius = DUNGEON_RADIUS_TILES) {
  return {
    id: ZONE_ID.DUNGEON,
    label: ZONE_META[ZONE_ID.DUNGEON].label,
    safe: false,
    center: { x: center.x, y: center.y },
    radius,
  };
}

/** Chebyshev distance — square zone aligned to the tile grid. */
export function isTileInZone(zone, tileX, tileY) {
  const dx = Math.abs(tileX - zone.center.x);
  const dy = Math.abs(tileY - zone.center.y);
  return Math.max(dx, dy) <= zone.radius;
}

export function isTileInZoneId(map, zoneId, tileX, tileY) {
  for (const zone of map.zones ?? []) {
    if (zone.id === zoneId && isTileInZone(zone, tileX, tileY)) return true;
  }
  return false;
}

export function isTileInAnySafeZone(map, tileX, tileY) {
  for (const zone of map.zones ?? []) {
    if (zone.safe && isTileInZone(zone, tileX, tileY)) return true;
  }
  return false;
}

export function isInSafeZone(map, pixelX, pixelY) {
  if (isTownHubMap(map)) return true;
  const tileX = Math.floor(pixelX / TILE_SIZE);
  const tileY = Math.floor(pixelY / TILE_SIZE);
  return isTileInAnySafeZone(map, tileX, tileY);
}

/** Resolve zone at a tile; wilderness is the default outside marked regions. */
export function getZoneAt(map, tileX, tileY) {
  for (const zone of map.zones ?? []) {
    if (isTileInZone(zone, tileX, tileY)) {
      const meta =
        ZONE_META[zone.id] ??
        (zone.id === BOSS_ROOM_ZONE_ID ? BOSS_ROOM_META : { label: zone.id, color: '#ffffff' });
      return {
        id: zone.id,
        label: zone.label ?? meta.label,
        color: meta.color,
        safe: !!zone.safe,
      };
    }
  }

  const meta = ZONE_META[ZONE_ID.WILDERNESS];
  return {
    id: ZONE_ID.WILDERNESS,
    label: meta.label,
    color: meta.color,
    safe: false,
  };
}

export function getZoneAtPixel(map, pixelX, pixelY) {
  return getZoneAt(map, Math.floor(pixelX / TILE_SIZE), Math.floor(pixelY / TILE_SIZE));
}
