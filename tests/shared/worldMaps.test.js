import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAP_ID, WORLD_MAP_IDS, getMapDisplayName, MAP_LABELS, sanitizeMapId } from '../../shared/worldMaps.js';
import { createWorld } from '../../server/world/World.js';

describe('worldMaps', () => {
  it('getMapDisplayName returns labels for known maps', () => {
    assert.equal(getMapDisplayName(MAP_ID.TOWN), MAP_LABELS[MAP_ID.TOWN]);
    assert.equal(getMapDisplayName(MAP_ID.WILDERNESS), 'Wilderness');
    assert.equal(getMapDisplayName(MAP_ID.DUNGEON), 'Dungeon');
    assert.equal(getMapDisplayName(MAP_ID.FOREST), 'Dark Forest');
    assert.equal(getMapDisplayName(MAP_ID.DESERT), 'Scorched Desert');
  });

  it('WORLD_MAP_IDS includes forest and desert', () => {
    assert.ok(WORLD_MAP_IDS.includes(MAP_ID.FOREST));
    assert.ok(WORLD_MAP_IDS.includes(MAP_ID.DESERT));
    assert.equal(WORLD_MAP_IDS.length, 5);
  });

  it('createWorld registers all instanced maps with portals', () => {
    const world = createWorld();
    for (const mapId of WORLD_MAP_IDS) {
      assert.ok(world.getMap(mapId), `missing map ${mapId}`);
    }

    const wilderness = world.getMap(MAP_ID.WILDERNESS);
    assert.ok(wilderness.portals.some((portal) => portal.id === 'wilderness-forest'));
    assert.ok(wilderness.portals.some((portal) => portal.id === 'wilderness-desert'));
    assert.ok(world.getMap(MAP_ID.FOREST).portals.length > 0);
    assert.ok(world.getMap(MAP_ID.DESERT).portals.length > 0);
  });

  it('sanitizeMapId falls back for unknown ids', () => {
    assert.equal(sanitizeMapId(MAP_ID.FOREST), MAP_ID.FOREST);
    assert.equal(sanitizeMapId('bogus', MAP_ID.TOWN), MAP_ID.TOWN);
  });

  it('getMapDisplayName falls back for unknown ids', () => {
    assert.equal(getMapDisplayName('unknown'), 'Unknown Area');
    assert.equal(getMapDisplayName(null), 'Unknown Area');
  });
});
