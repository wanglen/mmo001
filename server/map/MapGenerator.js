import { TILE, TILE_WALKABLE, MAP_WIDTH, MAP_HEIGHT } from '../../shared/constants.js';
import { createTownZone, spawnSafeRadiusTiles } from '../../shared/zones.js';

const MAX_GENERATION_ATTEMPTS = 10;

/** Minimum walkable region size scales with map area (~35% of interior). */
export function minConnectedTiles(width, height) {
  return Math.floor((width - 2) * (height - 2) * 0.35);
}

const BASE_MAP_WIDTH = 40;

function mapDimScale(width) {
  return Math.max(1, width / BASE_MAP_WIDTH);
}

function createGrassGrid(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TILE.GRASS)
  );
}

function placeCluster(tiles, width, height, tileType, startX, startY, size) {
  let x = startX;
  let y = startY;
  let placed = 0;
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  while (placed < size) {
    if (x >= 0 && y >= 0 && x < width && y < height && tiles[y][x] === TILE.GRASS) {
      tiles[y][x] = tileType;
      placed++;
    }

    const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
    x = Math.max(0, Math.min(width - 1, x + dx));
    y = Math.max(0, Math.min(height - 1, y + dy));
  }
}

function placeObstacleClusters(tiles, width, height) {
  const scale = mapDimScale(width);
  const waterClusters = Math.floor((6 + Math.random() * 3) * scale);
  const treeClusters = Math.floor((5 + Math.random() * 3) * scale);

  for (let i = 0; i < waterClusters; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const size = Math.floor((18 + Math.random() * 20) * scale);
    placeCluster(tiles, width, height, TILE.WATER, x, y, size);
  }

  for (let i = 0; i < treeClusters; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const size = Math.floor((12 + Math.random() * 15) * scale);
    placeCluster(tiles, width, height, TILE.TREE, x, y, size);
  }
}

function clearArea(tiles, centerX, centerY, radius) {
  const height = tiles.length;
  const width = tiles[0].length;

  for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x++) {
      tiles[y][x] = TILE.GRASS;
    }
  }
}

function floodFill(tiles, width, height, startX, startY) {
  const visited = new Set();
  const queue = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const { x, y } = queue.shift();

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited.has(key)) continue;
      if (!TILE_WALKABLE[tiles[ny][nx]]) continue;

      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return visited;
}

function findLargestWalkableRegion(tiles, width, height) {
  const visited = new Set();
  let bestSpawn = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  let bestSize = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key) || !TILE_WALKABLE[tiles[y][x]]) continue;

      const region = floodFill(tiles, width, height, x, y);
      region.forEach((k) => visited.add(k));

      if (region.size > bestSize) {
        bestSize = region.size;
        const [sx, sy] = [...region][Math.floor(region.size / 2)].split(',').map(Number);
        bestSpawn = { x: sx, y: sy };
      }
    }
  }

  return { spawn: bestSpawn, connectedSize: bestSize };
}

function placeRockBorder(tiles, width, height) {
  for (let x = 0; x < width; x++) {
    tiles[0][x] = TILE.ROCK;
    tiles[height - 1][x] = TILE.ROCK;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = TILE.ROCK;
    tiles[y][width - 1] = TILE.ROCK;
  }
}

function buildMap(width, height) {
  const tiles = createGrassGrid(width, height);
  placeRockBorder(tiles, width, height);
  placeObstacleClusters(tiles, width, height);

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const spawnClear = Math.max(4, Math.floor(4 * mapDimScale(width)));
  clearArea(tiles, centerX, centerY, spawnClear);

  const { spawn, connectedSize } = findLargestWalkableRegion(tiles, width, height);
  clearArea(tiles, spawn.x, spawn.y, spawnSafeRadiusTiles(width));
  const zones = [createTownZone(spawn, width)];
  return { tiles, width, height, spawn, connectedSize, zones };
}

export function generateMap(width = MAP_WIDTH, height = MAP_HEIGHT) {
  const minConnected = minConnectedTiles(width, height);
  let map = buildMap(width, height);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS && map.connectedSize < minConnected; attempt++) {
    map = buildMap(width, height);
  }

  const { connectedSize, ...result } = map;
  return result;
}
