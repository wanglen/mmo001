import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerFromSave } from '../../../server/players/Player.js';
import { createOpenMap } from '../../helpers/fixtures.js';
import { TILE_SIZE } from '../../../shared/constants.js';
import { MAP_ID } from '../../../shared/worldMaps.js';

describe('createPlayerFromSave', () => {
  const map = createOpenMap();
  const spawn = { x: 2, y: 3 };
  const spawnX = 2 * TILE_SIZE + TILE_SIZE / 2;
  const spawnY = 3 * TILE_SIZE + TILE_SIZE / 2;

  const saved = {
    characterClass: 'warrior',
    level: 5,
    mapId: MAP_ID.DUNGEON,
    x: 100,
    y: 100,
    hp: 80,
    mp: 40,
    inventory: [],
    equipment: {},
  };

  it('restores saved map and position by default', () => {
    const player = createPlayerFromSave({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn,
      map,
      saved,
      mapId: MAP_ID.TOWN,
    });

    assert.equal(player.mapId, MAP_ID.DUNGEON);
    assert.equal(player.x, 100);
    assert.equal(player.y, 100);
  });

  it('falls back to login map when saved mapId is invalid', () => {
    const player = createPlayerFromSave({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn,
      map,
      saved: { ...saved, mapId: 'unknown-zone' },
      mapId: MAP_ID.TOWN,
    });

    assert.equal(player.mapId, MAP_ID.TOWN);
    assert.equal(player.x, 100);
    assert.equal(player.y, 100);
  });

  it('forceSpawn places player at town spawn on connect', () => {
    const player = createPlayerFromSave({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn,
      map,
      saved,
      mapId: MAP_ID.TOWN,
      forceSpawn: true,
    });

    assert.equal(player.mapId, MAP_ID.TOWN);
    assert.equal(player.x, spawnX);
    assert.equal(player.y, spawnY);
    assert.equal(player.level, 5);
  });
});
