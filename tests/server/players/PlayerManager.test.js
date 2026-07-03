import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlayerManager } from '../../../server/players/PlayerManager.js';
import { TILE_SIZE } from '../../../shared/constants.js';

describe('PlayerManager', () => {
  it('creates and retrieves a player', () => {
    const manager = new PlayerManager();
    const player = manager.create({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: { x: 1, y: 1 },
    });

    assert.equal(player.name, 'Hero');
    assert.equal(player.characterClass, 'warrior');
    assert.equal(player.facing, 'down');
    assert.equal(manager.get('p1'), player);
  });

  it('spawns player at tile center in pixel coordinates', () => {
    const manager = new PlayerManager();
    const player = manager.create({
      id: 'p1',
      name: 'Hero',
      characterClass: 'mage',
      spawn: { x: 2, y: 3 },
    });

    assert.equal(player.x, 2 * TILE_SIZE + TILE_SIZE / 2);
    assert.equal(player.y, 3 * TILE_SIZE + TILE_SIZE / 2);
  });

  it('updates player fields', () => {
    const manager = new PlayerManager();
    manager.create({
      id: 'p1',
      name: 'Hero',
      characterClass: 'ranger',
      spawn: { x: 0, y: 0 },
    });

    const updated = manager.update('p1', { moving: true, direction: 'up' });
    assert.equal(updated.moving, true);
    assert.equal(updated.direction, 'up');
  });

  it('returns null when updating missing player', () => {
    const manager = new PlayerManager();
    assert.equal(manager.update('missing', { x: 1 }), null);
  });

  it('removes players', () => {
    const manager = new PlayerManager();
    manager.create({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: { x: 0, y: 0 },
    });

    manager.remove('p1');
    assert.equal(manager.get('p1'), undefined);
    assert.deepEqual(manager.getAll(), []);
  });

  it('getAll returns serialized players', () => {
    const manager = new PlayerManager();
    manager.create({
      id: 'p1',
      name: 'Alice',
      characterClass: 'mage',
      spawn: { x: 1, y: 1 },
    });
    manager.create({
      id: 'p2',
      name: 'Bob',
      characterClass: 'warrior',
      spawn: { x: 2, y: 2 },
    });

    const all = manager.getAll();
    assert.equal(all.length, 2);
    assert.ok(all.every((p) => typeof p.id === 'string' && typeof p.x === 'number'));
  });
});
