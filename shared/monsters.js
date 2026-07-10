import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import { BOSS_TYPE } from './dungeon.js';
import { MAP_ID } from './worldMaps.js';
import { STATUS } from './plugins/combat/statusEffects.js';

export const MONSTER_TYPES = {
  goblin: {
    label: 'Goblin',
    hp: 40,
    speed: 2.5,
    damage: 4,
    aggroRange: 140,
    attackRange: 36,
    color: '#2ecc71',
    xpReward: 15,
  },
  skeleton: {
    label: 'Skeleton',
    hp: 55,
    speed: 2,
    damage: 7,
    aggroRange: 120,
    attackRange: 40,
    color: '#bdc3c7',
    xpReward: 25,
  },
  bat: {
    label: 'Bat',
    hp: 25,
    speed: 3.5,
    damage: 3,
    aggroRange: 160,
    attackRange: 32,
    color: '#8e44ad',
    xpReward: 10,
  },
  wolf: {
    label: 'Wolf',
    hp: 48,
    speed: 3.2,
    damage: 6,
    aggroRange: 150,
    attackRange: 36,
    color: '#8b7355',
    xpReward: 18,
  },
  wraith: {
    label: 'Wraith',
    hp: 42,
    speed: 2.8,
    damage: 6,
    aggroRange: 130,
    attackRange: 38,
    color: '#7d6b9e',
    xpReward: 22,
    onHitStatus: STATUS.SLOW,
  },
  scorpion: {
    label: 'Scorpion',
    hp: 62,
    speed: 1.8,
    damage: 8,
    aggroRange: 110,
    attackRange: 34,
    color: '#c97b2e',
    xpReward: 28,
    onHitStatus: STATUS.POISON,
  },
  ghoul: {
    label: 'Ghoul',
    hp: 70,
    speed: 2.2,
    damage: 9,
    aggroRange: 125,
    attackRange: 40,
    color: '#5d8a68',
    xpReward: 32,
  },
  [BOSS_TYPE]: {
    label: 'Dungeon Lord',
    hp: 280,
    speed: 2,
    damage: 14,
    aggroRange: 200,
    attackRange: 44,
    color: '#c0392b',
    xpReward: 150,
    isBoss: true,
  },
};

/** Non-boss monster type ids (quests, validation, spawn tables). */
export const REGULAR_MONSTER_TYPES = Object.keys(MONSTER_TYPES).filter(
  (type) => !MONSTER_TYPES[type].isBoss
);

/** Original MVP: 12 monsters on a 40×30 map — scale count with map area. */
const BASE_SPAWN_COUNT = 12;
const BASE_MAP_TILES = 40 * 30;

export function spawnCountForMap(width, height) {
  return Math.max(
    BASE_SPAWN_COUNT,
    Math.round((BASE_SPAWN_COUNT * width * height) / BASE_MAP_TILES)
  );
}

export const SPAWN_COUNT = spawnCountForMap(MAP_WIDTH, MAP_HEIGHT);

/** Weighted monster pools per instanced map (regular types only). */
export const BIOME_SPAWN_WEIGHTS = {
  [MAP_ID.WILDERNESS]: { goblin: 48, wolf: 28, skeleton: 14, bat: 10 },
  [MAP_ID.FOREST]: { skeleton: 42, wraith: 40, goblin: 10, bat: 8 },
  [MAP_ID.DESERT]: { bat: 38, scorpion: 42, goblin: 10, skeleton: 10 },
  [MAP_ID.DUNGEON]: { skeleton: 30, ghoul: 42, goblin: 18, bat: 10 },
};

/**
 * Pick a regular monster type for the given map using biome weights.
 * @param {string | null | undefined} mapId
 * @param {() => number} [random]
 */
export function pickSpawnMonsterType(mapId, random = Math.random) {
  const weights = BIOME_SPAWN_WEIGHTS[mapId] ?? BIOME_SPAWN_WEIGHTS[MAP_ID.WILDERNESS];
  const entries = Object.entries(weights).filter(([type]) => MONSTER_TYPES[type] && !MONSTER_TYPES[type].isBoss);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;

  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }

  return entries[entries.length - 1][0];
}
