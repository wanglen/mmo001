import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHUNK_TILE_SIZE,
  createEmptyTileGrid,
  extractVisibleMapChunks,
  mergeMapTileChunks,
  getVisibleChunkBounds,
} from '../../../../shared/plugins/world/chunks.js';
import { TILE } from '../../../../shared/constants.js';

describe('chunks', () => {
  it('getVisibleChunkBounds centers on player tile', () => {
    const bounds = getVisibleChunkBounds(256, 256, 32, 120, 90, CHUNK_TILE_SIZE, 1);
    assert.equal(bounds.minCx, 0);
    assert.ok(bounds.maxCx >= bounds.minCx);
  });

  it('extractVisibleMapChunks returns chunk slices', () => {
    const tiles = Array.from({ length: 32 }, () => Array.from({ length: 32 }, () => 1));
    const payload = extractVisibleMapChunks(tiles, 32, 32, 256, 256, 32, 16);
    assert.ok(payload.chunks.length >= 1);
    assert.equal(payload.chunkSize, 16);
  });

  it('mergeMapTileChunks patches a tile grid', () => {
    const grid = Array.from({ length: 32 }, () => Array.from({ length: 32 }, () => TILE.UNKNOWN));
    mergeMapTileChunks(grid, {
      chunkSize: 16,
      chunks: [{ cx: 0, cy: 0, tiles: [[2, 2], [2, 2]] }],
    });
    assert.equal(grid[0][0], 2);
    assert.equal(grid[1][1], 2);
  });

  it('createEmptyTileGrid marks unknown tiles as non-walkable', () => {
    const grid = createEmptyTileGrid(4, 4);
    assert.equal(grid[0][0], TILE.UNKNOWN);
    assert.equal(grid[3][3], TILE.UNKNOWN);
  });
});
