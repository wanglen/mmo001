import { TILE, TILE_WALKABLE } from '../../shared/constants.js';
import {
  createDungeonZone,
  TOWN_RADIUS_TILES,
  wildernessDungeonRadiusTiles,
  pickDungeonGateTile,
} from '../../shared/zones.js';
import { findPath } from '../../shared/pathfinding.js';
import { pickWildernessDungeonCenter, clearArea } from '../map/MapGenerator.js';

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

  const xStart = Math.min(spawn.x, portalTile.x);
  const xEnd = Math.max(spawn.x, portalTile.x);
  for (let x = xStart; x <= xEnd; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      clearTile(tiles, x, portalTile.y + dy, width, height);
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

/**
 * Place a visible dungeon pocket on the wilderness map and return the gate tile.
 * @param {{ tiles: number[][], spawn: { x: number, y: number }, width: number, height: number, zones?: object[] }} map
 */
export function placeWildernessDungeonGate(map) {
  const radius = wildernessDungeonRadiusTiles(map.width, map.height);
  let center = pickWildernessDungeonCenter(map.tiles, map.width, map.height, map.spawn, radius);

  if (!center) {
    center = {
      x: Math.max(radius + 2, map.width - radius - 3),
      y: Math.max(radius + 2, map.height - radius - 3),
    };
  }

  clearArea(map.tiles, center.x, center.y, radius);
  const gateTile = pickDungeonGateTile(center, radius, map.spawn);
  clearTile(map.tiles, gateTile.x, gateTile.y, map.width, map.height);
  carveGatePath(map, gateTile);

  map.zones = [...(map.zones ?? []), createDungeonZone(center, radius, { gateTile })];
  return gateTile;
}

/**
 * Place a wilderness portal gate far from spawn and other gates.
 * @param {{ tiles: number[][], spawn: { x: number, y: number }, width: number, height: number }} map
 * @param {{ excludeTiles?: Array<{ x: number, y: number }>, preferCorner?: 'nw' | 'ne' | 'sw' | 'se', minDistance?: number }} [options]
 */
export function pickWildernessPortalGate(map, options = {}) {
  const { excludeTiles = [], preferCorner = 'nw', minDistance = 24 } = options;
  const margin = 8;
  const w = map.width;
  const h = map.height;

  let minX = margin;
  let maxX = w - margin - 1;
  let minY = margin;
  let maxY = h - margin - 1;

  if (preferCorner === 'nw') {
    maxX = Math.floor(w * 0.42);
    maxY = Math.floor(h * 0.42);
  } else if (preferCorner === 'ne') {
    minX = Math.floor(w * 0.58);
    maxY = Math.floor(h * 0.42);
  } else if (preferCorner === 'sw') {
    maxX = Math.floor(w * 0.42);
    minY = Math.floor(h * 0.58);
  } else if (preferCorner === 'se') {
    minX = Math.floor(w * 0.58);
    minY = Math.floor(h * 0.58);
  }

  let best = null;
  let bestScore = -1;
  const step = 3;

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      if (!TILE_WALKABLE[map.tiles[y]?.[x]]) continue;
      if (excludeTiles.some((tile) => Math.hypot(tile.x - x, tile.y - y) < 14)) continue;

      const dist = Math.hypot(x - map.spawn.x, y - map.spawn.y);
      if (dist < minDistance) continue;

      if (dist > bestScore) {
        bestScore = dist;
        best = { x, y };
      }
    }
  }

  if (!best) {
    best = {
      x: Math.max(margin, Math.min(w - margin - 1, map.spawn.x)),
      y: Math.max(margin, Math.min(h - margin - 1, h - margin - 2)),
    };
  }

  clearTile(map.tiles, best.x, best.y, w, h);
  carveGatePath(map, best);
  return best;
}
