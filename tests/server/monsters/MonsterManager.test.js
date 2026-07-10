import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TILE } from '../../../shared/constants.js';
import {
  MonsterManager,
  getConnectedWalkableTiles,
} from '../../../server/monsters/MonsterManager.js';
import { spawnCountForMap } from '../../../shared/monsters.js';
import { createTownZone, createDungeonZone, isTileInAnySafeZone, totalSpawnTarget, dungeonSpawnBonus } from '../../../shared/zones.js';
import { generateDungeonLayout } from '../../../server/map/DungeonGenerator.js';
import { MAP_ID } from '../../../shared/worldMaps.js';
import { BOSS_RESPAWN_MS } from '../../../shared/dungeon.js';
import { MONSTER_TYPES, REGULAR_MONSTER_TYPES } from '../../../shared/monsters.js';
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

  it('spawnOnMap fills up to map-scaled count on open maps without dungeon', () => {
    const map = {
      ...createOpenMap(20, 20),
      spawn: { x: 10, y: 10 },
    };
    const target = spawnCountForMap(map.width, map.height);
    const manager = new MonsterManager();
    const placed = manager.spawnOnMap(map);
    assert.equal(placed, target);
    assert.equal(manager.getAll().length, target);
  });

  it('spawnOnMap adds extra monsters inside dungeon zones', () => {
    const map = {
      ...createOpenMap(30, 30),
      spawn: { x: 5, y: 5 },
      zones: [createDungeonZone({ x: 20, y: 20 }, 5)],
    };
    const manager = new MonsterManager();
    const placed = manager.spawnOnMap(map, 10);
    assert.equal(placed, totalSpawnTarget(10));
    const inDungeon = manager.getAll().filter((m) => {
      const tx = Math.floor(m.x / 32);
      const ty = Math.floor(m.y / 32);
      return Math.abs(tx - 20) <= 5 && Math.abs(ty - 20) <= 5;
    });
    assert.ok(inDungeon.length >= dungeonSpawnBonus(10));
  });

  it('spawnOnMap excludes town zone tiles', () => {
    const map = {
      ...createOpenMap(20, 20),
      spawn: { x: 10, y: 10 },
      zones: [createTownZone({ x: 10, y: 10 }, 20)],
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map, 20);
    for (const monster of manager.getAll()) {
      const tx = Math.floor(monster.x / 32);
      const ty = Math.floor(monster.y / 32);
      assert.ok(!isTileInAnySafeZone(map, tx, ty));
    }
  });

  it('ensurePopulation tops up after kills', () => {
    const map = {
      ...createOpenMap(20, 20),
      spawn: { x: 10, y: 10 },
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map, 2);
    manager.ensurePopulation(map, spawnCountForMap(map.width, map.height));
    assert.equal(manager.getAll().length, spawnCountForMap(map.width, map.height));
  });

  it('waits for boss respawn cooldown on instanced dungeon maps', () => {
    const map = {
      ...generateDungeonLayout(48, 40),
      mapId: MAP_ID.DUNGEON,
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map);
    const boss = manager.getAll().find((monster) => monster.isBoss);
    assert.ok(boss);

    manager.remove(boss.id);
    manager.recordBossDefeat(50_000);
    assert.equal(manager.spawnBossIfNeeded(map, 50_000 + BOSS_RESPAWN_MS - 1000), false);
    assert.equal(manager.spawnBossIfNeeded(map, 50_000 + BOSS_RESPAWN_MS), true);
    assert.ok(manager.hasBoss());
  });

  it('spawnOnMap scales monsters to average player level on the map', () => {
    const map = {
      ...createOpenMap(20, 20),
      mapId: MAP_ID.WILDERNESS,
      spawn: { x: 10, y: 10 },
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map, 3, { players: [{ level: 10 }, { level: 8 }] });

    for (const monster of manager.getAll()) {
      assert.equal(monster.level, 9);
      assert.ok(monster.maxHp > MONSTER_TYPES[monster.type].hp);
    }
  });

  it('spawnOnMap uses zone-specific monster types per biome', () => {
    for (const [mapId, allowedExclusive, forbidden] of [
      [MAP_ID.FOREST, ['wraith'], ['scorpion', 'ghoul', 'wolf']],
      [MAP_ID.DESERT, ['scorpion'], ['wraith', 'ghoul', 'wolf']],
      [MAP_ID.WILDERNESS, ['wolf'], ['wraith', 'scorpion', 'ghoul']],
      [MAP_ID.DUNGEON, ['ghoul'], ['wraith', 'scorpion', 'wolf']],
    ]) {
      const map = {
        ...createOpenMap(24, 24),
        mapId,
        spawn: { x: 12, y: 12 },
      };
      const manager = new MonsterManager();
      manager.spawnOnMap(map, 50);

      const counts = Object.fromEntries(REGULAR_MONSTER_TYPES.map((type) => [type, 0]));
      for (const monster of manager.getAll()) {
        counts[monster.type]++;
      }

      assert.ok(
        allowedExclusive.some((type) => counts[type] > 0),
        `${mapId} should spawn ${allowedExclusive.join('/')}, got ${JSON.stringify(counts)}`
      );
      for (const type of forbidden) {
        assert.equal(counts[type], 0, `${mapId} should not spawn ${type}`);
      }
    }
  });
});
