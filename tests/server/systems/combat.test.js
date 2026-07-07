import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processAttack, clearAttackAnim } from '../../../server/systems/combat.js';
import { ATTACK_COOLDOWN_MS, ATTACK_ANIM_MS } from '../../../shared/combat.js';
import { createTownZone } from '../../../shared/zones.js';
import { TILE_SIZE } from '../../../shared/constants.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { Player } from '../../../server/players/Player.js';

function createMockPlayer(overrides = {}) {
  const stats = createPlayerStats('warrior');
  const player = new Player({
    id: 'p1',
    name: 'Hero',
    characterClass: 'warrior',
    x: 100,
    y: 100,
    stats,
  });
  Object.assign(player, overrides);
  return player;
}

function createMockMonsterManager(monster) {
  const monsters = new Map([[monster.id, { ...monster }]]);
  return {
    get(id) {
      return monsters.get(id);
    },
    remove(id) {
      monsters.delete(id);
    },
    monsters,
  };
}

describe('processAttack', () => {
  it('deals damage when in range', () => {
    const player = createMockPlayer({ lastAttackAt: 0 });
    const monsterManager = createMockMonsterManager({
      id: 'm1',
      x: 120,
      y: 100,
      hp: 200,
    });

    const result = processAttack({
      player,
      targetId: 'm1',
      monsterManager,
      now: 1000,
    });

    assert.equal(result.ok, true);
    assert.ok(result.damage >= 1);
    assert.equal(monsterManager.monsters.get('m1').hp, 200 - result.damage);
    assert.equal(monsterManager.monsters.get('m1').provoked, true);
    assert.equal(monsterManager.monsters.get('m1').targetPlayerId, 'p1');
  });

  it('grants xp and removes monster on kill', () => {
    const player = createMockPlayer({ lastAttackAt: 0, xp: 0, str: 99 });
    const monsterManager = createMockMonsterManager({
      id: 'm1',
      type: 'goblin',
      x: 120,
      y: 100,
      hp: 1,
      xpReward: 15,
    });

    const result = processAttack({
      player,
      targetId: 'm1',
      monsterManager,
      now: 1000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.killed, true);
    assert.equal(result.xp.xpGained, 15);
    assert.equal(player.xp, 15);
    assert.equal(monsterManager.monsters.has('m1'), false);
  });

  it('rejects attack on cooldown', () => {
    const player = createMockPlayer({ lastAttackAt: 5000 });
    const monsterManager = createMockMonsterManager({
      id: 'm1',
      x: 120,
      y: 100,
      hp: 40,
    });

    const result = processAttack({
      player,
      targetId: 'm1',
      monsterManager,
      now: 5000 + ATTACK_COOLDOWN_MS - 100,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'cooldown');
  });

  it('rejects attack in town zone', () => {
    const map = {
      zones: [createTownZone({ x: 3, y: 3 }, 40)],
    };
    const player = createMockPlayer({
      lastAttackAt: 0,
      x: 3 * TILE_SIZE + TILE_SIZE / 2,
      y: 3 * TILE_SIZE + TILE_SIZE / 2,
    });
    const monsterManager = createMockMonsterManager({
      id: 'm1',
      x: 500,
      y: 500,
      hp: 40,
    });

    const result = processAttack({
      player,
      targetId: 'm1',
      monsterManager,
      map,
      now: 1000,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'safe_zone');
  });

  it('clearAttackAnim resets attacking flag', () => {
    const player = createMockPlayer({
      attacking: true,
      lastAttackAt: 1000,
    });
    clearAttackAnim(player, 1000 + ATTACK_ANIM_MS);
    assert.equal(player.attacking, false);
  });
});
