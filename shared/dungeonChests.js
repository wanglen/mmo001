import { TILE, TILE_SIZE } from './constants.js';
import { isInstancedDungeonMap } from './dungeon.js';

export const CHEST_OPEN_RANGE = 48;
export const CHEST_HIT_RADIUS = 18;

/** @param {number} tileX @param {number} tileY */
export function chestTileKey(tileX, tileY) {
  return `${tileX},${tileY}`;
}

/** @param {object} raw */
export function normalizeOpenedChests(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [mapId, keys] of Object.entries(raw)) {
    if (Array.isArray(keys)) out[mapId] = [...keys];
  }
  return out;
}

/** @param {object} player @param {string} mapId */
export function getOpenedChestKeys(player, mapId) {
  const keys = player?.openedChests?.[mapId];
  return Array.isArray(keys) ? keys : [];
}

/** @param {object} player @param {string} mapId @param {string} key */
export function hasOpenedChest(player, mapId, key) {
  return getOpenedChestKeys(player, mapId).includes(key);
}

/** @param {object} player @param {string} mapId @param {string} key */
export function markChestOpened(player, mapId, key) {
  if (!player.openedChests) player.openedChests = {};
  if (!Array.isArray(player.openedChests[mapId])) player.openedChests[mapId] = [];
  if (!player.openedChests[mapId].includes(key)) player.openedChests[mapId].push(key);
}

/** @param {object} map @param {number} tileX @param {number} tileY */
export function tileHasChest(map, tileX, tileY) {
  if (!map?.tiles) return false;
  if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) return false;
  return map.tiles[tileY][tileX] === TILE.CHEST;
}

export function isInChestOpenRange(px, py, chestX, chestY, range = CHEST_OPEN_RANGE) {
  return Math.hypot(chestX - px, chestY - py) <= range;
}

/**
 * Chest under the cursor (unopened only).
 * @param {object} map
 * @param {number} worldX
 * @param {number} worldY
 * @param {string[]} [openedKeys]
 * @param {number} [tileSize]
 */
export function findChestAt(map, worldX, worldY, openedKeys = [], tileSize = TILE_SIZE) {
  if (!isInstancedDungeonMap(map) || !map?.tiles) return null;

  const opened = new Set(openedKeys);
  const baseCol = Math.floor(worldX / tileSize);
  const baseRow = Math.floor(worldY / tileSize);

  for (let row = baseRow - 1; row <= baseRow + 1; row++) {
    for (let col = baseCol - 1; col <= baseCol + 1; col++) {
      if (!tileHasChest(map, col, row)) continue;

      const key = chestTileKey(col, row);
      if (opened.has(key)) continue;

      const cx = col * tileSize + tileSize / 2;
      const cy = row * tileSize + tileSize / 2;
      if (Math.hypot(worldX - cx, worldY - cy) > CHEST_HIT_RADIUS) continue;

      return { tileX: col, tileY: row, key, x: cx, y: cy };
    }
  }

  return null;
}
