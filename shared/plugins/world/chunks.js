import { TILE } from '../../constants.js';

/** Tiles per chunk edge — used for interest regions and partial map sync. */
export const CHUNK_TILE_SIZE = 16;

/**
 * @param {number} pixel
 * @param {number} tileSize
 */
export function tileCoord(pixel, tileSize) {
  return Math.floor(pixel / tileSize);
}

/**
 * @param {number} tile
 * @param {number} chunkSize
 */
export function chunkCoord(tile, chunkSize = CHUNK_TILE_SIZE) {
  return Math.floor(tile / chunkSize);
}

/**
 * Visible chunk index bounds around a pixel position.
 * @returns {{ minCx: number, maxCx: number, minCy: number, maxCy: number }}
 */
export function getVisibleChunkBounds(
  pixelX,
  pixelY,
  tileSize,
  mapWidthTiles,
  mapHeightTiles,
  chunkSize = CHUNK_TILE_SIZE,
  paddingChunks = 1
) {
  const tileX = tileCoord(pixelX, tileSize);
  const tileY = tileCoord(pixelY, tileSize);
  const cx = chunkCoord(tileX, chunkSize);
  const cy = chunkCoord(tileY, chunkSize);
  const maxCx = chunkCoord(Math.max(0, mapWidthTiles - 1), chunkSize);
  const maxCy = chunkCoord(Math.max(0, mapHeightTiles - 1), chunkSize);

  return {
    minCx: Math.max(0, cx - paddingChunks),
    maxCx: Math.min(maxCx, cx + paddingChunks),
    minCy: Math.max(0, cy - paddingChunks),
    maxCy: Math.min(maxCy, cy + paddingChunks),
  };
}

/**
 * @param {{ x: number, y: number }} entity
 * @param {number} tileSize
 * @param {number} chunkSize
 * @param {{ minCx: number, maxCx: number, minCy: number, maxCy: number }} bounds
 */
export function entityInVisibleChunks(entity, tileSize, chunkSize, bounds) {
  const cx = chunkCoord(tileCoord(entity.x, tileSize), chunkSize);
  const cy = chunkCoord(tileCoord(entity.y, tileSize), chunkSize);
  return (
    cx >= bounds.minCx &&
    cx <= bounds.maxCx &&
    cy >= bounds.minCy &&
    cy <= bounds.maxCy
  );
}

/**
 * @template {{ x: number, y: number }} T
 */
export function filterByVisibleChunks(
  entities,
  pixelX,
  pixelY,
  tileSize,
  mapWidthTiles,
  mapHeightTiles,
  chunkSize = CHUNK_TILE_SIZE,
  paddingChunks = 1
) {
  if (!Array.isArray(entities) || entities.length === 0) return [];
  const bounds = getVisibleChunkBounds(
    pixelX,
    pixelY,
    tileSize,
    mapWidthTiles,
    mapHeightTiles,
    chunkSize,
    paddingChunks
  );
  return entities.filter((entity) =>
    entityInVisibleChunks(entity, tileSize, chunkSize, bounds)
  );
}

/**
 * Extract map tile slices for visible chunks.
 * @param {number[][]} tiles
 * @param {number} mapWidth
 * @param {number} mapHeight
 * @param {number} pixelX
 * @param {number} pixelY
 * @param {number} tileSize
 * @param {number} [chunkSize]
 * @returns {{ chunkSize: number, chunks: { cx: number, cy: number, tiles: number[][] }[] }}
 */
export function extractVisibleMapChunks(
  tiles,
  mapWidth,
  mapHeight,
  pixelX,
  pixelY,
  tileSize,
  chunkSize = CHUNK_TILE_SIZE
) {
  const bounds = getVisibleChunkBounds(
    pixelX,
    pixelY,
    tileSize,
    mapWidth,
    mapHeight,
    chunkSize,
    1
  );

  const chunks = [];
  for (let cy = bounds.minCy; cy <= bounds.maxCy; cy++) {
    for (let cx = bounds.minCx; cx <= bounds.maxCx; cx++) {
      const startY = cy * chunkSize;
      const startX = cx * chunkSize;
      const slice = [];
      for (let row = 0; row < chunkSize; row++) {
        const y = startY + row;
        if (y >= mapHeight) break;
        const line = [];
        for (let col = 0; col < chunkSize; col++) {
          const x = startX + col;
          if (x >= mapWidth) break;
          line.push(tiles[y]?.[x] ?? 0);
        }
        slice.push(line);
      }
      chunks.push({ cx, cy, tiles: slice });
    }
  }

  return { chunkSize, chunks };
}

/**
 * @param {number[][] | null} base
 * @param {number} width
 * @param {number} height
 */
export function createEmptyTileGrid(width, height, base = null) {
  if (base && base.length === height && base[0]?.length === width) {
    return base.map((row) => row.slice());
  }

  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const existing = base?.[y]?.[x];
      row.push(existing == null ? TILE.UNKNOWN : existing);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * @param {number[][]} target
 * @param {{ chunkSize: number, chunks: { cx: number, cy: number, tiles: number[][] }[] }} payload
 */
export function mergeMapTileChunks(target, payload) {
  if (!payload?.chunks?.length) return target;

  const chunkSize = payload.chunkSize ?? CHUNK_TILE_SIZE;
  for (const chunk of payload.chunks) {
    const startY = chunk.cy * chunkSize;
    const startX = chunk.cx * chunkSize;
    for (let row = 0; row < chunk.tiles.length; row++) {
      const y = startY + row;
      if (!target[y]) continue;
      for (let col = 0; col < chunk.tiles[row].length; col++) {
        const x = startX + col;
        target[y][x] = chunk.tiles[row][col];
      }
    }
  }

  return target;
}
