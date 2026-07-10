import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  provokeMonster,
  resolveMonsterTarget,
  monsterAttackPlayer,
  monsterAttackSummon,
} from '../../../server/systems/monsterCombat.js';
import { MONSTER_ATTACK_COOLDOWN_MS } from '../../../shared/combat.js';
import { createTownZone } from '../../../shared/zones.js';
import { TILE_SIZE } from '../../../shared/constants.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { Player } from '../../../server/players/Player.js';

function createPlayer(id, x, y) {
  const stats = createPlayerStats('warrior');
  return new Player({ id, name: 'Hero', characterClass: 'warrior', x, y, stats });
}

function createMonster(overrides = {}) {
  return {
    id: 'm1',
    x: 200,
    y: 200,
    hp: 40,
    damage: 5,
    aggroRange: 140,
    attackRange: 36,
    speed: 2,
    targetPlayerId: null,
    targetMonsterId: null,
    provoked: false,
    lastAttackAt: 0,
    moving: false,
    ...overrides,
  };
}

function createSummon(overrides = {}) {
  return {
    id: 's1',
    x: 120,
    y: 100,
    hp: 30,
    maxHp: 30,
    isSummon: true,
    ownerId: 'p1',
    ...overrides,
  };
}

describe('monsterCombat', () => {
  it('provokeMonster locks target to attacker', () => {
    const monster = createMonster();
    const player = createPlayer('p1', 100, 100);
    provokeMonster(monster, player);
    assert.equal(monster.targetPlayerId, 'p1');
    assert.equal(monster.targetMonsterId, null);
    assert.equal(monster.provoked, true);
  });

  it('provokeMonster locks onto thralls that hit it', () => {
    const monster = createMonster();
    const summon = createSummon({ id: 's9', ownerId: 'p2' });
    provokeMonster(monster, summon);
    assert.equal(monster.targetMonsterId, 's9');
    assert.equal(monster.targetPlayerId, 'p2');
    assert.equal(monster.provoked, true);
  });

  it('resolveMonsterTarget chases provoked attacker beyond aggro range', () => {
    const monster = createMonster({ x: 100, y: 100, aggroRange: 50 });
    const player = createPlayer('p1', 250, 100);
    provokeMonster(monster, player);

    const target = resolveMonsterTarget(monster, [player]);
    assert.equal(target?.kind, 'player');
    assert.equal(target?.entity?.id, 'p1');
  });

  it('resolveMonsterTarget prefers nearby thralls over distant players', () => {
    const monster = createMonster({ x: 100, y: 100, aggroRange: 200 });
    const player = createPlayer('p1', 250, 100);
    const summon = createSummon({ id: 's1', x: 130, y: 100 });

    const target = resolveMonsterTarget(monster, [player], null, [summon]);
    assert.equal(target?.kind, 'summon');
    assert.equal(target?.entity?.id, 's1');
  });

  it('resolveMonsterTarget ignores dead players', () => {
    const monster = createMonster({ x: 100, y: 100, aggroRange: 200 });
    const dead = createPlayer('dead', 120, 100);
    dead.hp = 0;
    dead.dead = true;
    const alive = createPlayer('alive', 180, 100);

    const target = resolveMonsterTarget(monster, [dead, alive]);

    assert.equal(target?.kind, 'player');
    assert.equal(target?.entity?.id, 'alive');
  });

  it('resolveMonsterTarget ignores players in town zone', () => {
    const map = {
      zones: [createTownZone({ x: 3, y: 3 }, 40)],
    };
    const monster = createMonster({ x: 100, y: 100, aggroRange: 500 });
    const player = createPlayer('p1', 3 * TILE_SIZE + TILE_SIZE / 2, 3 * TILE_SIZE + TILE_SIZE / 2);

    const target = resolveMonsterTarget(monster, [player], map);
    assert.equal(target, null);
  });

  it('monsterAttackPlayer ignores players in town zone', () => {
    const map = {
      zones: [createTownZone({ x: 3, y: 3 }, 40)],
    };
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0 });
    const player = createPlayer('p1', 3 * TILE_SIZE + TILE_SIZE / 2, 3 * TILE_SIZE + TILE_SIZE / 2);

    const result = monsterAttackPlayer(monster, player, map, 5000);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'safe_zone');
  });

  it('monsterAttackPlayer deals damage in melee range', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0 });
    const player = createPlayer('p1', 120, 100);
    const hpBefore = player.hp;

    const result = monsterAttackPlayer(monster, player, null, 5000);
    assert.equal(result.ok, true);
    if (result.dodged) {
      assert.equal(result.damage, 0);
      assert.equal(player.hp, hpBefore);
    } else {
      assert.ok(result.damage >= 1);
      assert.ok(player.hp < hpBefore);
    }
  });

  it('monsterAttackSummon damages and can kill thralls', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0, damage: 12 });
    const summon = createSummon({ x: 120, y: 100, hp: 10 });
    const removed = [];
    const manager = { remove: (id) => removed.push(id) };

    const result = monsterAttackSummon(monster, summon, manager, 5000);
    assert.equal(result.ok, true);
    assert.equal(result.killed, true);
    assert.deepEqual(removed, ['s1']);
  });

  it('monsterAttackPlayer kills player at zero hp', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0, damage: 99 });
    const player = createPlayer('p1', 120, 100);
    player.hp = 5;

    const result = monsterAttackPlayer(monster, player, null, 5000);

    assert.equal(result.ok, true);
    assert.equal(result.killed, true);
    assert.equal(player.dead, true);
    assert.equal(player.hp, 0);
  });

  it('monsterAttackPlayer ignores dead players', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0 });
    const player = createPlayer('p1', 120, 100);
    player.hp = 0;
    player.dead = true;

    const result = monsterAttackPlayer(monster, player, null, 5000);

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'target_dead');
  });

  it('monsterAttackPlayer respects cooldown', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 5000 });
    const player = createPlayer('p1', 120, 100);

    const result = monsterAttackPlayer(monster, player, null, 5000 + MONSTER_ATTACK_COOLDOWN_MS - 100);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'cooldown');
  });
});
