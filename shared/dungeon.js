import { MAP_ID } from './worldMaps.js';

/** Instanced dungeon map uses higher mob counts than wilderness. */
export const DUNGEON_SPAWN_MULTIPLIER = 2;

export const BOSS_TYPE = 'dungeonLord';

/** Boss room zone id — distinct from wilderness dungeon pocket. */
export const BOSS_ROOM_ZONE_ID = 'bossRoom';

export const BOSS_ROOM_META = {
  label: 'Boss Room',
  color: '#e74c3c',
};

/**
 * @param {number} baseCount — default SPAWN_COUNT for map dimensions
 */
export function dungeonMobCount(baseCount) {
  return Math.max(1, Math.round(baseCount * DUNGEON_SPAWN_MULTIPLIER));
}

/** @param {{ mapId?: string }} map */
export function isInstancedDungeonMap(map) {
  return map?.mapId === MAP_ID.DUNGEON;
}

/**
 * @param {{ x: number, y: number }} center — tile coordinates
 * @param {number} radius
 */
export function createBossRoomZone(center, radius) {
  return {
    id: BOSS_ROOM_ZONE_ID,
    label: BOSS_ROOM_META.label,
    safe: false,
    center: { x: center.x, y: center.y },
    radius,
  };
}

/** @param {{ zones?: Array<{ id: string }> }} map */
export function getBossRoomZone(map) {
  return (map.zones ?? []).find((zone) => zone.id === BOSS_ROOM_ZONE_ID) ?? null;
}
