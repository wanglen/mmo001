import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';

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
};

/** Original MVP: 12 monsters on a 40×30 map — scale count with map area. */
const BASE_SPAWN_COUNT = 12;
const BASE_MAP_TILES = 40 * 30;

export const SPAWN_COUNT = Math.max(
  BASE_SPAWN_COUNT,
  Math.round((BASE_SPAWN_COUNT * MAP_WIDTH * MAP_HEIGHT) / BASE_MAP_TILES)
);
