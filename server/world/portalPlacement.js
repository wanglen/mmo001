import { TILE, TILE_WALKABLE } from '../../shared/constants.js';
import { TOWN_RADIUS_TILES } from '../../shared/zones.js';
import { findPath } from '../../shared/pathfinding.js';

function clearTile(tiles, x, y, width, height) {
  if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) return;
  tiles[y][x] = TILE.GRASS;
}

/**
 * Carve a walkable gate from spawn to the portal tile (3 tiles wide).
 * @param {{ tiles: number[][], spawn: { x: number, y: number }, width: number, height: number }} map
 * @param {{ x: number, y: number }} portalTile
 */
export function carveGatePath(map, portalTile) {
  const { tiles, spawn, width, height } = map;
  const yStart = Math.min(spawn.y, portalTile.y);
  const yEnd = Math.max(spawn.y, portalTile.y);

  for (let y = yStart; y <= yEnd; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      clearTile(tiles, portalTile.x + dx, y, width, height);
    }
  }
}

function isReachable(map, portalTile) {
  return findPath(map, map.spawn.x, map.spawn.y, portalTile.x, portalTile.y).length > 0;
}

function isWalkableTile(map, tile) {
  if (tile.y <= 0 || tile.x <= 0 || tile.y >= map.height - 1 || tile.x >= map.width - 1) {
    return false;
  }
  return TILE_WALKABLE[map.tiles[tile.y][tile.x]];
}

/**
 * Pick a southern town gate tile connected to spawn; clears obstacles on the path.
 * @param {{ tiles: number[][], spawn: { x: number, y: number }, width: number, height: number }} map
 */
export function pickTownWildernessGate(map) {
  const baseY = Math.min(map.spawn.y + TOWN_RADIUS_TILES, map.height - 2);
  const candidates = [];

  for (let dy = 0; dy <= 4; dy++) {
    candidates.push({ x: map.spawn.x, y: baseY + dy });
  }
  for (const dx of [-2, 2]) {
    candidates.push({ x: map.spawn.x + dx, y: baseY });
  }

  for (const candidate of candidates) {
    if (!isWalkableTile(map, candidate) && candidate.y >= map.height - 2) continue;
    carveGatePath(map, candidate);
    if (isReachable(map, candidate)) return candidate;
  }

  const fallback = { x: map.spawn.x, y: baseY };
  carveGatePath(map, fallback);
  return fallback;
}

/**
 * Ensure a portal tile is walkable and reachable from spawn.
 * @param {{ tiles: number[][], spawn: { x: number, y: number }, width: number, height: number }} map
 * @param {{ x: number, y: number }} portalTile
 */
export function ensurePortalReachable(map, portalTile) {
  carveGatePath(map, portalTile);
  return portalTile;
}
