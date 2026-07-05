import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  provokeMonster,
  resolveMonsterTarget,
  monsterAttackPlayer,
} from '../../../server/systems/monsterCombat.js';
import { MONSTER_ATTACK_COOLDOWN_MS } from '../../../shared/combat.js';
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
    provoked: false,
    lastAttackAt: 0,
    moving: false,
    ...overrides,
  };
}

describe('monsterCombat', () => {
  it('provokeMonster locks target to attacker', () => {
    const monster = createMonster();
    const player = createPlayer('p1', 100, 100);
    provokeMonster(monster, player);
    assert.equal(monster.targetPlayerId, 'p1');
    assert.equal(monster.provoked, true);
  });

  it('resolveMonsterTarget chases provoked attacker beyond aggro range', () => {
    const monster = createMonster({ x: 100, y: 100, aggroRange: 50 });
    const player = createPlayer('p1', 250, 100);
    provokeMonster(monster, player);

    const target = resolveMonsterTarget(monster, [player]);
    assert.equal(target?.id, 'p1');
  });

  it('resolveMonsterTarget ignores dead players', () => {
    const monster = createMonster({ x: 100, y: 100, aggroRange: 200 });
    const dead = createPlayer('dead', 120, 100);
    dead.hp = 0;
    dead.dead = true;
    const alive = createPlayer('alive', 180, 100);

    const target = resolveMonsterTarget(monster, [dead, alive]);

    assert.equal(target?.id, 'alive');
  });

  it('monsterAttackPlayer deals damage in melee range', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0 });
    const player = createPlayer('p1', 120, 100);
    const hpBefore = player.hp;

    const result = monsterAttackPlayer(monster, player, 5000);
    assert.equal(result.ok, true);
    assert.ok(result.damage >= 1);
    assert.ok(player.hp < hpBefore);
    assert.equal(result.killed, false);
  });

  it('monsterAttackPlayer kills player at zero hp', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 0, damage: 99 });
    const player = createPlayer('p1', 120, 100);
    player.hp = 5;

    const result = monsterAttackPlayer(monster, player, 5000);

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

    const result = monsterAttackPlayer(monster, player, 5000);

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'target_dead');
  });

  it('monsterAttackPlayer respects cooldown', () => {
    const monster = createMonster({ x: 100, y: 100, lastAttackAt: 5000 });
    const player = createPlayer('p1', 120, 100);

    const result = monsterAttackPlayer(monster, player, 5000 + MONSTER_ATTACK_COOLDOWN_MS - 100);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'cooldown');
  });
});
