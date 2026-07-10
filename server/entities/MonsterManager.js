import { createMonster } from './Monster.js';
import { MONSTER_TYPES, SPAWN_COUNT, spawnCountForMap, pickSpawnMonsterType } from '../../shared/monsters.js';
import { rollEliteModifier, applyEliteModifier } from '../../shared/plugins/combat/eliteModifiers.js';
import {
  getMovementSpeedMultiplier,
  isStunned,
  tickStatusEffects,
} from '../../shared/plugins/combat/statusEffects.js';
import { TILE_WALKABLE } from '../../shared/constants.js';
import { tileToPixel, pixelToTile } from '../map/collision.js';
import { canMoveTo } from '../map/collision.js';
import { isInRange } from '../../shared/combat.js';
import {
  ZONE_ID,
  isTileInAnySafeZone,
  isTileInZoneId,
  totalSpawnTarget,
  DUNGEON_EXTRA_SPAWN_RATIO,
} from '../../shared/zones.js';
import {
  BOSS_TYPE,
  BOSS_ROOM_ZONE_ID,
  dungeonMobCount,
  getBossRoomZone,
  isInstancedDungeonMap,
  canRespawnBoss,
} from '../../shared/dungeon.js';
import { MAP_ID } from '../../shared/worldMaps.js';
import { resolveMonsterScaleLevel } from '../../shared/plugins/combat/monsterScaling.js';
import { resolveMonsterTarget, monsterAttackPlayer } from '../plugins/combat/monsterCombat.js';

const DIRECTION_DELTA = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const MIN_SPAWN_TILES_FROM_PLAYER = 5;

function resolveMapId(map) {
  return map?.mapId ?? MAP_ID.WILDERNESS;
}

function resolveSpawnTarget(map, count = SPAWN_COUNT) {
  if (isInstancedDungeonMap(map)) return dungeonMobCount(count);
  const hasDungeon = (map.zones ?? []).some((zone) => zone.id === ZONE_ID.DUNGEON);
  return hasDungeon ? totalSpawnTarget(count) : count;
}

function isBossRoomTile(map, tileX, tileY) {
  return isTileInZoneId(map, BOSS_ROOM_ZONE_ID, tileX, tileY);
}

function defaultSpawnCount(map) {
  if (map?.width && map?.height) return spawnCountForMap(map.width, map.height);
  return SPAWN_COUNT;
}

function placementCount(map, count, exactCount = false) {
  if (exactCount) return count;
  if (isInstancedDungeonMap(map)) return dungeonMobCount(count);
  return count;
}

function isOutsideSafeZones(map, tileX, tileY) {
  return !isTileInAnySafeZone(map, tileX, tileY);
}

function pickDirection(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  if (Math.abs(dy) > 0.5) return dy > 0 ? 'down' : 'up';
  return null;
}

/** Walkable tiles reachable from spawn (same region as the player). */
export function getConnectedWalkableTiles(map) {
  const { spawn, width, height, tiles } = map;
  const visited = new Set();
  const result = [];
  const queue = [{ x: spawn.x, y: spawn.y }];

  visited.add(`${spawn.x},${spawn.y}`);

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    result.push({ x, y });

    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited.has(key)) continue;
      if (!TILE_WALKABLE[tiles[ny][nx]]) continue;

      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return result;
}

function shuffle(tiles) {
  const list = [...tiles];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function filterSpawnCandidates(map, connected) {
  let candidates = connected.filter(
    (tile) =>
      isOutsideSafeZones(map, tile.x, tile.y) &&
      Math.hypot(tile.x - map.spawn.x, tile.y - map.spawn.y) >= MIN_SPAWN_TILES_FROM_PLAYER
  );

  if (candidates.length === 0) {
    candidates = connected.filter(
      (tile) =>
        isOutsideSafeZones(map, tile.x, tile.y) &&
        (tile.x !== map.spawn.x || tile.y !== map.spawn.y)
    );
  }

  return candidates;
}

function placeMonstersOnTiles(manager, tiles, count, mapId, scaleLevel = 1) {
  if (count <= 0 || tiles.length === 0) return 0;

  const shuffled = shuffle(tiles);
  const toPlace = Math.min(count, shuffled.length);
  let placed = 0;

  for (let i = 0; i < toPlace; i++) {
    const tile = shuffled[i];
    const type = pickSpawnMonsterType(mapId);
    const { x, y } = tileToPixel(tile.x, tile.y);
    const monster = createMonster(type, x, y, scaleLevel);
    if (!MONSTER_TYPES[type]?.isBoss) {
      const eliteId = rollEliteModifier();
      if (eliteId) applyEliteModifier(monster, eliteId);
    }
    manager.monsters.set(monster.id, monster);
    placed++;
  }

  return placed;
}

export class MonsterManager {
  constructor() {
    this.monsters = new Map();
    /** @type {number | null} ms timestamp when instanced dungeon boss was last killed */
    this.bossDefeatedAt = null;
    /** @type {Array<{ level?: number, dead?: boolean }>} players used for last scale resolution */
    this.lastSpawnPlayers = [];
  }

  spawnOnMap(map, count = defaultSpawnCount(map), options = {}) {
    const mapId = resolveMapId(map);
    const scaleLevel = resolveMonsterScaleLevel(map, options.players ?? []);
    const connected = getConnectedWalkableTiles(map);
    const candidates = filterSpawnCandidates(map, connected);

    if (candidates.length === 0) return 0;

    const toPlace = placementCount(map, count, options.exactCount);

    if (isInstancedDungeonMap(map)) {
      const mobCandidates = candidates.filter((tile) => !isBossRoomTile(map, tile.x, tile.y));
      const placed = placeMonstersOnTiles(this, mobCandidates, toPlace, mapId, scaleLevel);
      this.spawnBossIfNeeded(map, Date.now(), scaleLevel);
      return placed;
    }

    const wildernessCandidates = candidates.filter(
      (tile) => !isTileInZoneId(map, ZONE_ID.DUNGEON, tile.x, tile.y)
    );
    const dungeonCandidates = candidates.filter((tile) =>
      isTileInZoneId(map, ZONE_ID.DUNGEON, tile.x, tile.y)
    );

    const basePlaced = placeMonstersOnTiles(
      this,
      wildernessCandidates,
      count,
      mapId,
      scaleLevel
    );
    const bonusPlaced = placeMonstersOnTiles(
      this,
      dungeonCandidates,
      totalSpawnTarget(count) - count,
      mapId,
      scaleLevel
    );
    return basePlaced + bonusPlaced;
  }

  hasBoss() {
    return this.getAllEntities().some((monster) => monster.isBoss);
  }

  recordBossDefeat(now = Date.now()) {
    this.bossDefeatedAt = now;
  }

  spawnBossIfNeeded(map, now = Date.now(), scaleLevel = null) {
    const bossZone = getBossRoomZone(map);
    if (!bossZone || this.hasBoss()) return false;
    if (isInstancedDungeonMap(map) && !canRespawnBoss(this.bossDefeatedAt, now)) {
      return false;
    }

    const level =
      scaleLevel ?? resolveMonsterScaleLevel(map, this.lastSpawnPlayers ?? []);
    const { x, y } = tileToPixel(bossZone.center.x, bossZone.center.y);
    const boss = createMonster(BOSS_TYPE, x, y, level);
    this.monsters.set(boss.id, boss);
    return true;
  }

  /** Top up monsters on the player's reachable region when population is low. */
  ensurePopulation(map, target = defaultSpawnCount(map), now = Date.now(), playersOnMap = []) {
    this.lastSpawnPlayers = playersOnMap;
    const scaleLevel = resolveMonsterScaleLevel(map, playersOnMap);
    const goal = resolveSpawnTarget(map, target);
    const current = this.getAllEntities().filter((monster) => !monster.isBoss).length;
    if (current >= goal) {
      this.spawnBossIfNeeded(map, now, scaleLevel);
      return 0;
    }
    const missing = goal - current;
    const hasWildernessDungeon = (map.zones ?? []).some((zone) => zone.id === ZONE_ID.DUNGEON);
    const baseMissing =
      hasWildernessDungeon && !isInstancedDungeonMap(map)
        ? Math.max(1, Math.ceil(missing / (1 + DUNGEON_EXTRA_SPAWN_RATIO)))
        : missing;
    const added = this.spawnOnMap(map, baseMissing, {
      exactCount: true,
      players: playersOnMap,
    });
    this.spawnBossIfNeeded(map, now, scaleLevel);
    return added;
  }

  get(id) {
    return this.monsters.get(id);
  }

  getAll() {
    return Array.from(this.monsters.values())
      .filter((m) => m.hp > 0)
      .map((m) => m.toJSON());
  }

  getAllEntities() {
    return Array.from(this.monsters.values()).filter((m) => m.hp > 0);
  }

  remove(id) {
    this.monsters.delete(id);
  }

  tick(map, players, now = Date.now()) {
    for (const monster of this.monsters.values()) {
      if (monster.hp <= 0) continue;

      const dotDamage = tickStatusEffects(monster, now);
      if (dotDamage > 0) {
        monster.hp = Math.max(0, monster.hp - dotDamage);
        if (monster.hp <= 0) continue;
      }

      if (isStunned(monster, now)) {
        monster.moving = false;
        continue;
      }

      const speedMult = getMovementSpeedMultiplier(monster, now);
      const effectiveSpeed = monster.baseSpeed * speedMult;

      const target = resolveMonsterTarget(monster, players, map);

      if (!target) {
        monster.moving = false;
        monster.targetPlayerId = null;
        continue;
      }

      monster.targetPlayerId = target.id;

      if (isInRange(monster.x, monster.y, target.x, target.y, monster.attackRange)) {
        monster.moving = false;
        monsterAttackPlayer(monster, target, map, now);
        continue;
      }

      const direction = pickDirection(monster.x, monster.y, target.x, target.y);
      if (!direction) continue;

      const delta = DIRECTION_DELTA[direction];
      const nextX = monster.x + delta.x * effectiveSpeed;
      const nextY = monster.y + delta.y * effectiveSpeed;

      if (canMoveTo(map, nextX, nextY)) {
        const { x: tileX, y: tileY } = pixelToTile(nextX, nextY);
        if (isTileInAnySafeZone(map, tileX, tileY)) {
          monster.moving = false;
          continue;
        }
        monster.x = nextX;
        monster.y = nextY;
        monster.moving = true;
      } else {
        monster.moving = false;
      }
    }
  }
}
