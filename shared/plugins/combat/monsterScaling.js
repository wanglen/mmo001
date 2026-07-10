import { MAP_ID } from '../../worldMaps.js';

/** Extra effective levels by instanced map (zone depth). */
export const ZONE_LEVEL_BONUS = {
  [MAP_ID.WILDERNESS]: 0,
  [MAP_ID.FOREST]: 1,
  [MAP_ID.DESERT]: 2,
  [MAP_ID.DUNGEON]: 3,
};

export const MONSTER_SCALE_PER_LEVEL = {
  hp: 0.12,
  damage: 0.08,
  xp: 0.1,
};

/** Cap effective scale level for stat growth. */
export const MAX_MONSTER_SCALE_LEVEL = 40;

/**
 * Average level of living players (minimum 1 when list is empty).
 * @param {Array<{ level?: number, dead?: boolean }>} players
 */
export function averagePlayerLevel(players) {
  const living = (players ?? []).filter((p) => !p.dead);
  if (!living.length) return 1;

  const sum = living.reduce((acc, p) => acc + Math.max(1, p.level ?? 1), 0);
  return Math.max(1, Math.round(sum / living.length));
}

/**
 * Effective monster level from zone depth + nearby player progression.
 * @param {{ mapId?: string }} map
 * @param {Array<{ level?: number, dead?: boolean }>} [playersOnMap]
 */
export function resolveMonsterScaleLevel(map, playersOnMap = []) {
  const mapId = map?.mapId ?? MAP_ID.WILDERNESS;
  const zoneBonus = ZONE_LEVEL_BONUS[mapId] ?? 0;
  const playerLevel = averagePlayerLevel(playersOnMap);
  return Math.min(MAX_MONSTER_SCALE_LEVEL, playerLevel + zoneBonus);
}

/**
 * @param {import('../../monsters.js').MONSTER_TYPES[string]} def
 * @param {number} scaleLevel
 */
export function scaleMonsterDefinition(def, scaleLevel) {
  if (!def || scaleLevel <= 1) {
    return {
      hp: def.hp,
      damage: def.damage,
      xpReward: def.xpReward ?? 10,
    };
  }

  const tiers = scaleLevel - 1;
  return {
    hp: Math.max(1, Math.floor(def.hp * (1 + MONSTER_SCALE_PER_LEVEL.hp * tiers))),
    damage: Math.max(1, Math.floor(def.damage * (1 + MONSTER_SCALE_PER_LEVEL.damage * tiers))),
    xpReward: Math.max(
      1,
      Math.floor((def.xpReward ?? 10) * (1 + MONSTER_SCALE_PER_LEVEL.xp * tiers))
    ),
  };
}
