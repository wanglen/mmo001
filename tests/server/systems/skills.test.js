import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processSkill } from '../../../server/systems/skills.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { Player } from '../../../server/players/Player.js';
import { createOpenMap } from '../../helpers/fixtures.js';

function createMockPlayer(characterClass, overrides = {}) {
  const stats = createPlayerStats(characterClass);
  const player = new Player({
    id: 'p1',
    name: 'Hero',
    characterClass,
    x: 100,
    y: 100,
    stats,
  });
  Object.assign(player, overrides);
  return player;
}

function createMockMonsterManager(monsters) {
  const map = new Map(monsters.map((m) => [m.id, { ...m }]));
  return {
    get(id) {
      return map.get(id);
    },
    remove(id) {
      map.delete(id);
    },
    getAllEntities() {
      return Array.from(map.values()).filter((m) => m.hp > 0);
    },
    monsters: map,
  };
}

describe('processSkill', () => {
  const map = createOpenMap(20, 20);

  it('cleave damages monsters in arc', () => {
    const player = createMockPlayer('warrior', { mp: 30, aimX: 150, aimY: 100 });
    const monsterManager = createMockMonsterManager([
      { id: 'm1', type: 'goblin', x: 140, y: 100, hp: 50, xpReward: 10 },
      { id: 'm2', type: 'goblin', x: 60, y: 100, hp: 50, xpReward: 10 },
    ]);

    const result = processSkill({
      player,
      skillId: 'cleave',
      targetX: 150,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, true);
    assert.ok(result.hits.length >= 1);
    assert.ok(player.mp < 30);
    assert.ok(monsterManager.get('m1').hp < 50);
    assert.equal(monsterManager.get('m2').hp, 50);
  });

  it('whirlwind damages monsters on all sides', () => {
    const player = createMockPlayer('warrior', {
      mp: 30,
      aimX: 150,
      aimY: 100,
      unlockedSkills: ['cleave', 'charge', 'whirlwind'],
    });
    const monsterManager = createMockMonsterManager([
      { id: 'm1', type: 'goblin', x: 140, y: 100, hp: 50, xpReward: 10 },
      { id: 'm2', type: 'goblin', x: 60, y: 100, hp: 50, xpReward: 10 },
    ]);

    const result = processSkill({
      player,
      skillId: 'whirlwind',
      targetX: 150,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.hits.length, 2);
    assert.ok(monsterManager.get('m1').hp < 50);
    assert.ok(monsterManager.get('m2').hp < 50);
  });

  it('shield bash stuns a single target', () => {
    const player = createMockPlayer('warrior', {
      mp: 30,
      aimX: 130,
      aimY: 100,
      unlockedSkills: ['cleave', 'charge', 'shield_bash'],
    });
    const monsterManager = createMockMonsterManager([
      { id: 'm1', type: 'goblin', x: 130, y: 100, hp: 50, xpReward: 10, statusEffects: [] },
    ]);

    const result = processSkill({
      player,
      skillId: 'shield_bash',
      targetX: 130,
      targetY: 100,
      targetId: 'm1',
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.hits.length, 1);
    const monster = monsterManager.get('m1');
    assert.ok(monster.statusEffects.some((effect) => effect.type === 'stun'));
  });

  it('iron will heals the caster', () => {
    const player = createMockPlayer('warrior', {
      mp: 30,
      hp: 80,
      maxHp: 120,
      aimX: 150,
      aimY: 100,
      unlockedSkills: ['cleave', 'charge', 'iron_will'],
    });
    const monsterManager = createMockMonsterManager([]);

    const result = processSkill({
      player,
      skillId: 'iron_will',
      targetX: 150,
      targetY: 100,
      monsterManager,
      map,
      now: 10000,
    });

    assert.equal(result.ok, true);
    assert.equal(player.hp, 100);
  });

  it('fireball requires mage class', () => {
    const player = createMockPlayer('warrior', { mp: 30 });
    const monsterManager = createMockMonsterManager([]);

    const result = processSkill({
      player,
      skillId: 'fireball',
      targetX: 200,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'wrong_class');
  });

  it('fireball miss stops at range limit not past it', () => {
    const player = createMockPlayer('mage', { mp: 50, x: 100, y: 100 });
    const monsterManager = createMockMonsterManager([]);

    const result = processSkill({
      player,
      skillId: 'fireball',
      targetX: 400,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.missed, true);
    assert.equal(player.lastSkillFx.impactX, 300);
    assert.equal(player.lastSkillFx.impactY, 100);
  });

  it('fireball hits first monster along aim ray', () => {
    const player = createMockPlayer('mage', { mp: 50, x: 100, y: 100 });
    const monsterManager = createMockMonsterManager([
      { id: 'm1', type: 'goblin', x: 130, y: 100, hp: 40, xpReward: 10 },
    ]);

    const result = processSkill({
      player,
      skillId: 'fireball',
      targetX: 200,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.missed, false);
    assert.equal(player.lastSkillFx.impactX, 130);
    assert.ok(monsterManager.get('m1').hp < 40);
  });

  it('rejects skill when out of mp', () => {
    const player = createMockPlayer('mage', { mp: 0 });
    const monsterManager = createMockMonsterManager([]);

    const result = processSkill({
      player,
      skillId: 'fireball',
      targetX: 200,
      targetY: 100,
      monsterManager,
      map,
      now: 5000,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'no_mp');
    assert.equal(player.mp, 0);
  });

  it('rejects skill on cooldown', () => {
    const player = createMockPlayer('ranger', {
      mp: 50,
      skillCooldowns: { arrow_shot: 9000 },
    });
    const monsterManager = createMockMonsterManager([
      { id: 'm1', type: 'goblin', x: 130, y: 100, hp: 40, xpReward: 10 },
    ]);

    const result = processSkill({
      player,
      skillId: 'arrow_shot',
      targetX: 130,
      targetY: 100,
      targetId: 'm1',
      monsterManager,
      map,
      now: 9500,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, 'cooldown');
  });
});
