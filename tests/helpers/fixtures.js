import { TILE } from '../../shared/constants.js';

/** 5×5 map with a water wall blocking direct path; detour via south. */
export function createSimpleMap() {
  return {
    width: 5,
    height: 5,
    tiles: [
      [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS],
      [TILE.GRASS, TILE.WATER, TILE.WATER, TILE.WATER, TILE.GRASS],
      [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS],
      [TILE.GRASS, TILE.TREE, TILE.TREE, TILE.TREE, TILE.GRASS],
      [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.GRASS],
    ],
  };
}

/** All grass 10×10 map. */
export function createOpenMap(width = 10, height = 10) {
  return {
    width,
    height,
    tiles: Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TILE.GRASS)
    ),
  };
}
