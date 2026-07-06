import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../shared/constants.js';
import {
  MINIMAP_MAX_HEIGHT,
  MINIMAP_MAX_WIDTH,
  minimapDimensions,
  minimapPlayerPoint,
  minimapScale,
  minimapScreenRect,
  minimapTileColor,
  minimapTileRect,
} from '../../shared/minimap.js';

describe('minimap', () => {
  it('minimapScale caps at 1 pixel per tile and fits large maps', () => {
    assert.equal(minimapScale(48, 40), 1);
    assert.ok(minimapScale(120, 90) <= 1);
    assert.equal(minimapDimensions(120, 90).width, 120);
    assert.equal(minimapDimensions(120, 90).height, 90);
  });

  it('minimapScreenRect anchors below zone badge on the top-right', () => {
    const rect = minimapScreenRect(800, 120, 90);
    assert.equal(rect.x, 800 - 16 - 120);
    assert.equal(rect.y, 52);
    assert.equal(rect.width, 120);
    assert.equal(rect.height, 90);
  });

  it('minimapTileRect maps tile coordinates into panel space', () => {
    const tileRect = minimapTileRect(48, 40, 10, 5, 100, 52, MINIMAP_MAX_WIDTH, MINIMAP_MAX_HEIGHT);
    assert.equal(tileRect.x, 110);
    assert.equal(tileRect.y, 57);
    assert.equal(tileRect.width, 1);
    assert.equal(tileRect.height, 1);
  });

  it('minimapTileColor returns distinct colors per terrain type', () => {
    assert.notEqual(minimapTileColor(TILE.GRASS), minimapTileColor(TILE.WATER));
    assert.notEqual(minimapTileColor(TILE.WALL), minimapTileColor(TILE.DOOR));
    assert.equal(minimapTileColor(TILE.CHEST), '#c49a2a');
  });

  it('minimapPlayerPoint tracks pixel position within the panel', () => {
    const point = minimapPlayerPoint(48, 40, 320, 160, 32, 200, 52, MINIMAP_MAX_WIDTH, MINIMAP_MAX_HEIGHT);
    assert.equal(point.x, 210);
    assert.equal(point.y, 57);
  });
});
