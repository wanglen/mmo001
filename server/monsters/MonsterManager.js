import { createMonster } from './Monster.js';
import { MONSTER_TYPES, SPAWN_COUNT } from '../../shared/monsters.js';
import { TILE_WALKABLE } from '../../shared/constants.js';
import { tileToPixel, pixelToTile } from '../map/collision.js';
import { canMoveTo } from '../map/collision.js';
import { isInRange } from '../../shared/combat.js';
import { isTileInAnySafeZone } from '../../shared/zones.js';
import { resolveMonsterTarget, monsterAttackPlayer } from '../systems/monsterCombat.js';

const DIRECTION_DELTA = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const MIN_SPAWN_TILES_FROM_PLAYER = 5;

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

export class MonsterManager {
  constructor() {
    this.monsters = new Map();
  }

  spawnOnMap(map, count = SPAWN_COUNT) {
    const types = Object.keys(MONSTER_TYPES);
    const connected = getConnectedWalkableTiles(map);

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

    if (candidates.length === 0) return 0;

    const shuffled = shuffle(candidates);
    const toPlace = Math.min(count, shuffled.length);
    let placed = 0;

    for (let i = 0; i < toPlace; i++) {
      const tile = shuffled[i];
      const type = types[placed % types.length];
      const { x, y } = tileToPixel(tile.x, tile.y);
      const monster = createMonster(type, x, y);
      this.monsters.set(monster.id, monster);
      placed++;
    }

    return placed;
  }

  /** Top up monsters on the player's reachable region when population is low. */
  ensurePopulation(map, target = SPAWN_COUNT) {
    const current = this.getAll().length;
    if (current >= target) return 0;
    return this.spawnOnMap(map, target - current);
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
      const nextX = monster.x + delta.x * monster.speed;
      const nextY = monster.y + delta.y * monster.speed;

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
