import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../../shared/constants.js';
import {
  MonsterManager,
  getConnectedWalkableTiles,
} from '../../../server/monsters/MonsterManager.js';
import { SPAWN_COUNT } from '../../../shared/monsters.js';
import { createOpenMap } from '../../helpers/fixtures.js';

describe('MonsterManager', () => {
  it('getConnectedWalkableTiles ignores isolated grass islands', () => {
    const map = {
      width: 5,
      height: 3,
      spawn: { x: 0, y: 1 },
      tiles: [
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
      ],
    };

    const connected = getConnectedWalkableTiles(map);
    assert.equal(connected.length, 9);
    assert.ok(connected.every((t) => t.x < 3));
  });

  it('spawnOnMap places monsters only on connected walkable tiles', () => {
    const map = {
      width: 5,
      height: 3,
      spawn: { x: 0, y: 1 },
      tiles: [
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
        [TILE.GRASS, TILE.GRASS, TILE.GRASS, TILE.WATER, TILE.GRASS],
      ],
    };

    const manager = new MonsterManager();
    const placed = manager.spawnOnMap(map, 4);
    assert.equal(placed, 4);

    const region = new Set(getConnectedWalkableTiles(map).map((t) => `${t.x},${t.y}`));
    for (const monster of manager.getAll()) {
      const tx = Math.floor(monster.x / 32);
      const ty = Math.floor(monster.y / 32);
      assert.ok(region.has(`${tx},${ty}`));
    }
  });

  it('spawnOnMap fills up to SPAWN_COUNT on open maps', () => {
    const map = {
      ...createOpenMap(20, 20),
      spawn: { x: 10, y: 10 },
    };
    const manager = new MonsterManager();
    const placed = manager.spawnOnMap(map);
    assert.equal(placed, SPAWN_COUNT);
    assert.equal(manager.getAll().length, SPAWN_COUNT);
  });

  it('ensurePopulation tops up after kills', () => {
    const map = {
      ...createOpenMap(20, 20),
      spawn: { x: 10, y: 10 },
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map, 2);
    manager.ensurePopulation(map, SPAWN_COUNT);
    assert.equal(manager.getAll().length, SPAWN_COUNT);
  });
});
