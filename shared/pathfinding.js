import { TILE_WALKABLE } from './constants.js';

const SQRT2 = Math.SQRT2;

function heuristic(ax, ay, bx, by) {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  const F = SQRT2 - 1;
  return dx < dy ? F * dx + dy : F * dy + dx;
}

function isWalkable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return TILE_WALKABLE[map.tiles[y][x]] === true;
}

function nodeKey(x, y) {
  return `${x},${y}`;
}

const CARDINAL_NEIGHBORS = [
  [0, 1, 1],
  [0, -1, 1],
  [1, 0, 1],
  [-1, 0, 1],
];

const DIAGONAL_NEIGHBORS = [
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

function canMoveDiagonally(map, fromX, fromY, dx, dy) {
  const nx = fromX + dx;
  const ny = fromY + dy;
  if (!isWalkable(map, nx, ny)) return false;
  if (!isWalkable(map, fromX + dx, fromY)) return false;
  if (!isWalkable(map, fromX, fromY + dy)) return false;
  return true;
}

export function findPath(map, startX, startY, endX, endY) {
  if (!isWalkable(map, endX, endY)) return [];

  const startKey = nodeKey(startX, startY);
  const endKey = nodeKey(endX, endY);

  if (startKey === endKey) return [{ x: endX, y: endY }];

  const open = [{ x: startX, y: startY, g: 0, f: heuristic(startX, startY, endX, endY) }];
  const openSet = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    const currentKey = nodeKey(current.x, current.y);
    openSet.delete(currentKey);

    if (currentKey === endKey) {
      const path = [];
      let key = endKey;
      while (key !== startKey) {
        const [px, py] = key.split(',').map(Number);
        path.unshift({ x: px, y: py });
        key = cameFrom.get(key);
      }
      return path;
    }

    for (const [dx, dy, cost] of CARDINAL_NEIGHBORS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!isWalkable(map, nx, ny)) continue;
      relaxNeighbor(current, nx, ny, cost, endX, endY, open, openSet, cameFrom, gScore);
    }

    for (const [dx, dy, cost] of DIAGONAL_NEIGHBORS) {
      if (!canMoveDiagonally(map, current.x, current.y, dx, dy)) continue;
      relaxNeighbor(
        current,
        current.x + dx,
        current.y + dy,
        cost,
        endX,
        endY,
        open,
        openSet,
        cameFrom,
        gScore
      );
    }
  }

  return [];
}

function relaxNeighbor(current, nx, ny, cost, endX, endY, open, openSet, cameFrom, gScore) {
  const currentKey = nodeKey(current.x, current.y);
  const neighborKey = nodeKey(nx, ny);
  const tentativeG = (gScore.get(currentKey) ?? Infinity) + cost;

  if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) return;

  cameFrom.set(neighborKey, currentKey);
  gScore.set(neighborKey, tentativeG);

  if (!openSet.has(neighborKey)) {
    open.push({
      x: nx,
      y: ny,
      g: tentativeG,
      f: tentativeG + heuristic(nx, ny, endX, endY),
    });
    openSet.add(neighborKey);
  }
}

export function findNearestWalkable(map, tileX, tileY, maxRadius = 8) {
  if (isWalkable(map, tileX, tileY)) return { x: tileX, y: tileY };

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = tileX + dx;
        const y = tileY + dy;
        if (isWalkable(map, x, y)) return { x, y };
      }
    }
  }

  return null;
}

export function tileToWorldCenter(tileX, tileY, tileSize) {
  return {
    x: tileX * tileSize + tileSize / 2,
    y: tileY * tileSize + tileSize / 2,
  };
}

export function worldToTile(worldX, worldY, tileSize) {
  return {
    x: Math.floor(worldX / tileSize),
    y: Math.floor(worldY / tileSize),
  };
}
