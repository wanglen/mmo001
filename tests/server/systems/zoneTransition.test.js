import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { usePortal, respawnToTown } from '../../../server/systems/zoneTransition.js';
import { createPortal } from '../../../shared/portals.js';
import { MAP_ID } from '../../../shared/worldMaps.js';
import { Player } from '../../../server/players/Player.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { createOpenMap } from '../../helpers/fixtures.js';

function createTestPlayer(overrides = {}) {
  const stats = createPlayerStats('warrior');
  const player = new Player({
    id: 'p1',
    name: 'Hero',
    characterClass: 'warrior',
    x: 100,
    y: 100,
    stats,
    mapId: MAP_ID.TOWN,
  });
  Object.assign(player, overrides);
  return player;
}

function createMockWorld() {
  const townMap = {
    ...createOpenMap(20, 20),
    mapId: MAP_ID.TOWN,
    spawn: { x: 5, y: 5 },
    portals: [
      createPortal({
        id: 'town-wilderness',
        label: 'Wilderness',
        tile: { x: 5, y: 8 },
        targetMapId: MAP_ID.WILDERNESS,
        targetTile: { x: 3, y: 3 },
      }),
    ],
  };

  const wildernessMap = {
    ...createOpenMap(30, 30),
    mapId: MAP_ID.WILDERNESS,
    spawn: { x: 3, y: 3 },
    portals: [],
  };

  const maps = new Map([
    [MAP_ID.TOWN, townMap],
    [MAP_ID.WILDERNESS, wildernessMap],
  ]);

  return {
    getMap(mapId) {
      return maps.get(mapId);
    },
    getContextForPlayer(player) {
      const mapId = player.mapId ?? MAP_ID.TOWN;
      return { map: maps.get(mapId), mapId };
    },
  };
}

describe('zoneTransition', () => {
  it('usePortal moves player to target map spawn when in range', () => {
    const world = createMockWorld();
    const portal = world.getMap(MAP_ID.TOWN).portals[0];
    const player = createTestPlayer({ x: portal.x, y: portal.y, mapId: MAP_ID.TOWN });

    const result = usePortal({ world, player, portalId: portal.id });

    assert.equal(result.ok, true);
    assert.equal(player.mapId, MAP_ID.WILDERNESS);
    assert.equal(player.moving, false);
  });

  it('usePortal rejects when out of range', () => {
    const world = createMockWorld();
    const player = createTestPlayer({ x: 0, y: 0, mapId: MAP_ID.TOWN });

    const result = usePortal({ world, player, portalId: 'town-wilderness' });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'out_of_range');
    assert.equal(player.mapId, MAP_ID.TOWN);
  });

  it('respawnToTown sends player to town spawn', () => {
    const world = createMockWorld();
    const player = createTestPlayer({ x: 500, y: 500, mapId: MAP_ID.WILDERNESS });

    const result = respawnToTown({ world, player });

    assert.equal(result.ok, true);
    assert.equal(player.mapId, MAP_ID.TOWN);
  });
});
