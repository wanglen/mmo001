import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTileAt,
  isWalkable,
  pixelToTile,
  tileToPixel,
  canMoveTo,
} from '../../../server/map/collision.js';
import { TILE, TILE_SIZE } from '../../../shared/constants.js';
import { createSimpleMap } from '../../helpers/fixtures.js';

describe('collision', () => {
  const map = createSimpleMap();

  it('getTileAt returns null out of bounds', () => {
    assert.equal(getTileAt(map, -1, 0), null);
    assert.equal(getTileAt(map, 0, 5), null);
  });

  it('isWalkable returns false for water and trees', () => {
    assert.equal(isWalkable(map, 1, 1), false);
    assert.equal(isWalkable(map, 1, 3), false);
    assert.equal(isWalkable(map, 0, 0), true);
  });

  it('pixelToTile and tileToPixel are consistent', () => {
    const pixel = tileToPixel(2, 3);
    assert.deepEqual(pixelToTile(pixel.x, pixel.y), { x: 2, y: 3 });
  });

  it('canMoveTo allows center of grass tile', () => {
    const { x, y } = tileToPixel(0, 0);
    assert.equal(canMoveTo(map, x, y), true);
  });

  it('canMoveTo blocks positions overlapping water', () => {
    const { x, y } = tileToPixel(1, 1);
    assert.equal(canMoveTo(map, x, y), false);
  });

  it('canMoveTo respects map edges', () => {
    assert.equal(canMoveTo(map, 0, 0), false);
  });
});

describe('collision tile constants', () => {
  it('TILE_SIZE matches shared constant used in conversions', () => {
    assert.equal(TILE_SIZE, 32);
    assert.equal(TILE.GRASS, 0);
  });
});
