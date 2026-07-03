import { TILE_WALKABLE } from './constants.js';

function heuristic(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function isWalkable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return TILE_WALKABLE[map.tiles[y][x]] === true;
}

function nodeKey(x, y) {
  return `${x},${y}`;
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

  const neighbors = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
  ];

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

    for (const [dx, dy] of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!isWalkable(map, nx, ny)) continue;

      const neighborKey = nodeKey(nx, ny);
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

      if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue;

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
  }

  return [];
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
