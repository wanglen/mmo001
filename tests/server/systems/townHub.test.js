import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelTownRecall,
  interruptTownRecall,
  restoreVitalityInTown,
  startTownRecall,
  tickTownRecall,
  teleportToTown,
} from '../../../server/systems/townHub.js';
import { Player } from '../../../server/players/Player.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { MAP_ID } from '../../../shared/worldMaps.js';
import { TOWN_RECALL_CAST_MS } from '../../../shared/townHub.js';
import { createOpenMap } from '../../helpers/fixtures.js';

function createPlayer(overrides = {}) {
  const stats = createPlayerStats('warrior');
  const player = new Player({
    id: 'p1',
    name: 'Hero',
    characterClass: 'warrior',
    x: 100,
    y: 100,
    stats,
    mapId: MAP_ID.WILDERNESS,
  });
  Object.assign(player, overrides);
  return player;
}

function createWorld() {
  const town = { ...createOpenMap(20, 20), mapId: MAP_ID.TOWN, spawn: { x: 5, y: 5 } };
  const wilderness = { ...createOpenMap(30, 30), mapId: MAP_ID.WILDERNESS, spawn: { x: 3, y: 3 } };
  const maps = new Map([
    [MAP_ID.TOWN, town],
    [MAP_ID.WILDERNESS, wilderness],
  ]);
  return {
    getMap(mapId) {
      return maps.get(mapId);
    },
  };
}

describe('townHub system', () => {
  it('restoreVitalityInTown fills hp and mp', () => {
    const player = createPlayer({ hp: 10, mp: 5, mapId: MAP_ID.TOWN });
    const map = { mapId: MAP_ID.TOWN, zones: [] };

    assert.equal(restoreVitalityInTown(player, map), true);
    assert.equal(player.hp, player.maxHp);
    assert.equal(player.mp, player.maxMp);
  });

  it('startTownRecall begins cast outside town only', () => {
    const player = createPlayer({ mapId: MAP_ID.WILDERNESS });
    const wilderness = { mapId: MAP_ID.WILDERNESS };
    const town = { mapId: MAP_ID.TOWN };

    assert.equal(startTownRecall(player, wilderness).ok, true);
    assert.equal(player.townRecallCasting, true);
    assert.equal(player.townRecallCastMs, 0);

    assert.equal(startTownRecall(player, town).ok, false);
    cancelTownRecall(player);
  });

  it('tickTownRecall teleports to town after cast duration', () => {
    const world = createWorld();
    const player = createPlayer({
      townRecallCasting: true,
      townRecallCastMs: TOWN_RECALL_CAST_MS - 50,
    });
    const map = world.getMap(MAP_ID.WILDERNESS);

    const result = tickTownRecall(player, map, world, 50);

    assert.equal(result.teleported, true);
    assert.equal(player.mapId, MAP_ID.TOWN);
    assert.equal(player.townRecallCasting, false);
  });

  it('interruptTownRecall cancels an active cast', () => {
    const player = createPlayer({ townRecallCasting: true, townRecallCastMs: 1000 });

    assert.equal(interruptTownRecall(player), true);
    assert.equal(player.townRecallCasting, false);
    assert.equal(player.townRecallCastMs, 0);
  });

  it('teleportToTown moves player to town spawn', () => {
    const world = createWorld();
    const player = createPlayer({ x: 500, y: 500, mapId: MAP_ID.WILDERNESS });

    const result = teleportToTown({ world, player });

    assert.equal(result.ok, true);
    assert.equal(player.mapId, MAP_ID.TOWN);
    assert.notEqual(player.x, 500);
  });
});
