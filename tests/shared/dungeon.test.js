import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_TYPE,
  BOSS_ROOM_ZONE_ID,
  createBossRoomZone,
  dungeonMobCount,
  getBossRoomZone,
  isInstancedDungeonMap,
  DUNGEON_SPAWN_MULTIPLIER,
} from '../../shared/dungeon.js';
import { MAP_ID } from '../../shared/worldMaps.js';

describe('dungeon helpers', () => {
  it('dungeonMobCount scales base spawn count', () => {
    assert.equal(dungeonMobCount(10), 10 * DUNGEON_SPAWN_MULTIPLIER);
    assert.equal(dungeonMobCount(1), DUNGEON_SPAWN_MULTIPLIER);
  });

  it('isInstancedDungeonMap matches dungeon mapId', () => {
    assert.ok(isInstancedDungeonMap({ mapId: MAP_ID.DUNGEON }));
    assert.ok(!isInstancedDungeonMap({ mapId: MAP_ID.WILDERNESS }));
  });

  it('createBossRoomZone and getBossRoomZone', () => {
    const zone = createBossRoomZone({ x: 10, y: 12 }, 4);
    assert.equal(zone.id, BOSS_ROOM_ZONE_ID);
    assert.equal(zone.radius, 4);
    assert.equal(getBossRoomZone({ zones: [zone] }), zone);
  });

  it('BOSS_TYPE is defined on monster types', async () => {
    const { MONSTER_TYPES } = await import('../../shared/monsters.js');
    assert.ok(MONSTER_TYPES[BOSS_TYPE]?.isBoss);
  });
});
