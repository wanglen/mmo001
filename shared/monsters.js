import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';
import { BOSS_TYPE } from './dungeon.js';

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
