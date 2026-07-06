import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createWorldStateBuilder } from '../../../server/app/WorldStateBuilder.js';
import { composePlayer } from '../../../server/app/composePlayer.js';
import { loadPlugins } from '../../../server/app/loadPlugins.js';
import { createPlayer } from '../../../server/players/Player.js';
import { PlayerManager } from '../../../server/players/PlayerManager.js';
import { World } from '../../../server/world/World.js';
import { MAP_ID } from '../../../shared/worldMaps.js';

const WORLD_STATE_KEYS = [
  'version',
  'map',
  'player',
  'players',
  'npcs',
  'monsters',
  'loot',
  'skillFx',
  'combatFx',
];

const PLAYER_KEYS = [
  'id',
  'name',
  'characterClass',
  'mapId',
  'x',
  'y',
  'hp',
  'mp',
  'level',
  'inventory',
  'equipment',
  'skillBar',
  'skillCooldowns',
  'gold',
  'quests',
];

describe('WorldStateBuilder', () => {
  it('builds a world snapshot with stable top-level keys', () => {
    const world = World.create();
    const playerManager = new PlayerManager();
    const town = world.getMap(MAP_ID.TOWN);

    const player = playerManager.create({
      id: 'socket-1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: town.spawn,
      map: town,
      mapId: MAP_ID.TOWN,
    });

    const state = createWorldStateBuilder().build(world, playerManager, player.id);

    for (const key of WORLD_STATE_KEYS) {
      assert.ok(key in state, `missing world state key: ${key}`);
    }

    assert.equal(state.player?.id, 'socket-1');
    assert.equal(state.map.mapId, MAP_ID.TOWN);
    assert.ok(Array.isArray(state.players));
    assert.ok(Array.isArray(state.monsters));
    assert.ok(Array.isArray(state.loot));
    assert.ok(Array.isArray(state.npcs));
  });

  it('omits map tiles when includeMapTiles is false', () => {
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

    const withTiles = createWorldStateBuilder().build(world, playerManager, 'socket-1', {
      includeMapTiles: true,
    });
    const withoutTiles = createWorldStateBuilder().build(world, playerManager, 'socket-1', {
      includeMapTiles: false,
    });

    assert.ok(withTiles.map.tiles);
    assert.equal(withoutTiles.map.tiles, undefined);
  });

  it('returns null player when viewer is not in game', () => {
    const world = World.create();
    const playerManager = new PlayerManager();
    const state = createWorldStateBuilder().build(world, playerManager, 'missing');

    assert.equal(state.player, null);
  });
});

describe('composePlayer', () => {
  it('merges plugin slices into a full player payload', () => {
    const player = createPlayer({
      id: 'p1',
      name: 'Hero',
      characterClass: 'warrior',
      spawn: { x: 2, y: 2 },
      mapId: MAP_ID.TOWN,
    });

    const payload = composePlayer(player, Date.now(), loadPlugins());

    for (const key of PLAYER_KEYS) {
      assert.ok(key in payload, `missing player key: ${key}`);
    }

    assert.equal(payload.id, 'p1');
    assert.ok(Array.isArray(payload.inventory));
    assert.ok(typeof payload.equipment === 'object');
    assert.ok(Array.isArray(payload.skillBar));
    assert.ok(typeof payload.quests === 'object');
  });

  it('matches Player.toJSON output', () => {
    const player = createPlayer({
      id: 'p1',
      name: 'Hero',
      characterClass: 'mage',
      spawn: { x: 1, y: 1 },
      mapId: MAP_ID.TOWN,
    });

    const now = Date.now();
    assert.deepEqual(composePlayer(player, now), player.toJSON(now));
  });
});

describe('plugin serialization hooks', () => {
  it('each gameplay plugin contributes serializePlayer or serializeWorld', () => {
    const plugins = loadPlugins();
    const serializers = {
      core: { player: true, world: true },
      combat: { player: true, world: true },
      loot: { player: true, world: true },
      quests: { player: true, world: false },
      social: { player: false, world: false },
      economy: { player: true, world: false },
    };

    for (const plugin of plugins) {
      const expected = serializers[plugin.id];
      assert.ok(expected, `unexpected plugin id: ${plugin.id}`);

      if (expected.player) {
        assert.equal(typeof plugin.serializePlayer, 'function', `${plugin.id} missing serializePlayer`);
      }
      if (expected.world) {
        assert.equal(typeof plugin.serializeWorld, 'function', `${plugin.id} missing serializeWorld`);
      }
    }
  });
});
