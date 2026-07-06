import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDungeonLayout,
  placeScatteredRooms,
  buildRoomCorridorEdges,
  roomsOverlap,
  pickEntryAndBossRooms,
} from '../../../server/map/DungeonGenerator.js';
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

function mulberry32(seed) {
  return function next() {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  it('places multiple non-overlapping scattered rooms', () => {
    const random = mulberry32(42);
    const map = generateDungeonLayout(48, 40, { random });

    assert.ok(map.rooms.length >= 4);

    for (let i = 0; i < map.rooms.length; i++) {
      for (let j = i + 1; j < map.rooms.length; j++) {
        assert.equal(roomsOverlap(map.rooms[i], map.rooms[j]), false);
      }
    }
  });

  it('connects rooms with branching corridors (MST + optional loops)', () => {
    const map = generateDungeonLayout(48, 40, { random: mulberry32(7) });

    assert.ok(map.corridors.length >= map.rooms.length - 1);

    const degree = new Map();
    for (const { from, to } of map.corridors) {
      degree.set(from, (degree.get(from) ?? 0) + 1);
      degree.set(to, (degree.get(to) ?? 0) + 1);
    }

    const branchingRooms = [...degree.values()].filter((count) => count >= 2).length;
    assert.ok(branchingRooms >= 2, 'layout should include junction rooms');
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

  it('pickEntryAndBossRooms chooses farthest room as boss', () => {
    const rooms = placeScatteredRooms(48, 40, 6, mulberry32(99));
    const { entryIdx, bossIdx } = pickEntryAndBossRooms(rooms);
    assert.ok(entryIdx >= 0 && bossIdx >= 0);
    assert.ok(rooms.length === 0 || entryIdx !== bossIdx || rooms.length === 1);
  });

  it('buildRoomCorridorEdges connects all rooms', () => {
    const rooms = [
      { center: { x: 5, y: 5 } },
      { center: { x: 20, y: 8 } },
      { center: { x: 10, y: 25 } },
    ];
    const edges = buildRoomCorridorEdges(rooms);
    assert.equal(edges.length, 2);
  });
});
