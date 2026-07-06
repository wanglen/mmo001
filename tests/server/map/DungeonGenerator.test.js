import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDungeonLayout } from '../../../server/map/DungeonGenerator.js';
import { TILE } from '../../../shared/constants.js';
import { BOSS_ROOM_ZONE_ID, BOSS_TYPE } from '../../../shared/dungeon.js';
import { WORLD_MAP_SIZES, MAP_ID } from '../../../shared/worldMaps.js';
import { isWalkable } from '../../../server/map/collision.js';
import { getConnectedWalkableTiles } from '../../../server/monsters/MonsterManager.js';
import { MonsterManager } from '../../../server/monsters/MonsterManager.js';
import { dungeonMobCount } from '../../../shared/dungeon.js';
import { spawnCountForMap } from '../../../shared/monsters.js';

function countTileType(tiles, tileType) {
  let count = 0;
  for (const row of tiles) {
    for (const tile of row) {
      if (tile === tileType) count++;
    }
  }
  return count;
}

describe('DungeonGenerator', () => {
  it('generates expected dimensions with rock walls and walkable corridors', () => {
    const { width, height } = WORLD_MAP_SIZES[MAP_ID.DUNGEON];
    const map = generateDungeonLayout(width, height);

    assert.equal(map.width, width);
    assert.equal(map.height, height);
    assert.ok(isWalkable(map, map.spawn.x, map.spawn.y));

    const rockCount = countTileType(map.tiles, TILE.ROCK);
    const grassCount = countTileType(map.tiles, TILE.GRASS);
    assert.ok(rockCount > grassCount, 'dungeon should be mostly rock walls');
    assert.ok(grassCount >= 40, 'dungeon should have carved walkable floor');
  });

  it('connects spawn to boss room through one walkable region', () => {
    const map = generateDungeonLayout(48, 40);
    const connected = getConnectedWalkableTiles(map);
    const bossZone = map.zones.find((zone) => zone.id === BOSS_ROOM_ZONE_ID);
    assert.ok(bossZone);

    const bossReachable = connected.some(
      (tile) =>
        Math.abs(tile.x - bossZone.center.x) <= bossZone.radius &&
        Math.abs(tile.y - bossZone.center.y) <= bossZone.radius
    );
    assert.ok(bossReachable, 'boss room should be reachable from spawn');
  });

  it('includes boss room zone ahead of dungeon zone', () => {
    const map = generateDungeonLayout(48, 40);
    assert.equal(map.zones[0].id, BOSS_ROOM_ZONE_ID);
    assert.ok(map.zones.some((zone) => zone.id === 'dungeon'));
  });

  it('spawns high mob density and a boss on instanced dungeon maps', () => {
    const map = {
      ...generateDungeonLayout(48, 40),
      mapId: MAP_ID.DUNGEON,
    };
    const manager = new MonsterManager();
    manager.spawnOnMap(map);

    const mobs = manager.getAll();
    const boss = mobs.find((monster) => monster.type === BOSS_TYPE);
    const regular = mobs.filter((monster) => !monster.isBoss);

    assert.ok(boss);
    assert.ok(boss.isBoss);
    const expected = dungeonMobCount(spawnCountForMap(48, 40));
    assert.ok(regular.length >= expected - 2);
  });
});
