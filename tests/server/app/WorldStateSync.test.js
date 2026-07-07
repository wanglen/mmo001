import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WorldStateSyncManager } from '../../../server/app/WorldStateSync.js';
import { World } from '../../../server/world/World.js';
import { PlayerManager } from '../../../server/players/PlayerManager.js';
import { MAP_ID } from '../../../shared/worldMaps.js';
import { FULL_SNAPSHOT_INTERVAL_TICKS } from '../../../shared/plugins/world/gameTick.js';

describe('WorldStateSyncManager', () => {
  it('sends full snapshot first then delta updates', () => {
    const sync = new WorldStateSyncManager();
    const world = World.create();
    const playerManager = new PlayerManager();
    const town = world.getMap(MAP_ID.TOWN);

    playerManager.create({
      id: 'socket-1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: town.spawn,
      map: town,
      mapId: MAP_ID.TOWN,
    });

    const full = sync.build('socket-1', world, playerManager, { tick: 1 });
    assert.equal(full.sync.delta, false);
    assert.ok(full.map);
    assert.ok(full.player);

    const delta = sync.build('socket-1', world, playerManager, { tick: 2 });
    assert.equal(delta.sync.delta, true);
    assert.ok(Array.isArray(delta.monsters));
    assert.ok(delta.player);
    assert.ok(delta.map?.tileChunks?.chunks?.length);

    const periodicFull = sync.build('socket-1', world, playerManager, {
      tick: 1 + FULL_SNAPSHOT_INTERVAL_TICKS,
    });
    assert.equal(periodicFull.sync.delta, false);
  });
});
