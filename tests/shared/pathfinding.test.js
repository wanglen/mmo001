import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findPath,
  findNearestWalkable,
  tileToWorldCenter,
  worldToTile,
} from '../../shared/pathfinding.js';
import { TILE_SIZE } from '../../shared/constants.js';
import { createSimpleMap, createOpenMap } from '../helpers/fixtures.js';

describe('pathfinding', () => {
  it('findPath returns empty array when destination is blocked', () => {
    const map = createSimpleMap();
    assert.deepEqual(findPath(map, 0, 0, 1, 1), []);
  });

  it('findPath routes around obstacles', () => {
    const map = createSimpleMap();
    const path = findPath(map, 0, 0, 4, 0);

    assert.ok(path.length > 0);
    assert.deepEqual(path[path.length - 1], { x: 4, y: 0 });
    for (const step of path) {
      assert.notEqual(map.tiles[step.y][step.x], 1); // not water
      assert.notEqual(map.tiles[step.y][step.x], 2); // not tree
    }
  });

  it('findPath on open map uses diagonal shortcuts', () => {
    const map = createOpenMap();
    const path = findPath(map, 0, 0, 3, 4);
    assert.ok(path.length < 7);
    assert.deepEqual(path[path.length - 1], { x: 3, y: 4 });
  });

  it('findPath avoids cutting corners through obstacles', () => {
    const map = {
      width: 3,
      height: 3,
      tiles: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ],
    };
    const path = findPath(map, 0, 0, 2, 2);
    assert.ok(path.length > 0);
    for (const step of path) {
      assert.equal(map.tiles[step.y][step.x], 0);
    }
    assert.notDeepEqual(path, [{ x: 2, y: 2 }]);
  });

  it('findPath returns single step when start equals end tile', () => {
    const map = createOpenMap();
    assert.deepEqual(findPath(map, 2, 2, 2, 2), [{ x: 2, y: 2 }]);
  });

  it('findNearestWalkable returns same tile when walkable', () => {
    const map = createSimpleMap();
    assert.deepEqual(findNearestWalkable(map, 0, 0), { x: 0, y: 0 });
  });

  it('findNearestWalkable finds adjacent grass near water', () => {
    const map = createSimpleMap();
    const nearest = findNearestWalkable(map, 1, 1);
    assert.ok(nearest);
    assert.equal(map.tiles[nearest.y][nearest.x], 0);
  });

  it('tileToWorldCenter converts tile to pixel center', () => {
    assert.deepEqual(tileToWorldCenter(1, 2, TILE_SIZE), { x: 48, y: 80 });
  });

  it('worldToTile converts pixel to tile coordinates', () => {
    assert.deepEqual(worldToTile(48, 80, TILE_SIZE), { x: 1, y: 2 });
  });
});
