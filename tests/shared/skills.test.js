import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKILLS,
  getSkillBar,
  getSkillIdAtSlot,
  canUseSkill,
  getAvailableMp,
  spendSkillMp,
  getSkillCooldownRemaining,
  calculateSkillDamage,
  findMonstersInRadius,
  findMonstersInArc,
  findMonsterAtGroundPoint,
  findFirstMonsterOnRay,
  resolveProjectileImpact,
} from '../../shared/skills.js';

describe('skills', () => {
  const warrior = {
    characterClass: 'warrior',
    mp: 30,
    skillCooldowns: {},
  };

  it('getSkillBar returns class-specific skills', () => {
    const bar = getSkillBar('warrior');
    assert.equal(bar[0]?.id, 'cleave');
    assert.equal(bar[1]?.id, 'charge');
    assert.equal(bar[2], null);

    const mageBar = getSkillBar('mage');
    assert.equal(mageBar[0]?.id, 'fireball');
    assert.equal(mageBar[1]?.id, 'icebolt');
  });

  it('getSkillIdAtSlot maps hotkey slots', () => {
    assert.equal(getSkillIdAtSlot('ranger', 0), 'arrow_shot');
    assert.equal(getSkillIdAtSlot('ranger', 1), 'multishot');
    assert.equal(getSkillIdAtSlot('ranger', 7), null);
  });

  it('canUseSkill checks mp, cooldown, and class', () => {
    assert.equal(canUseSkill(warrior, 'cleave').ok, true);
    assert.equal(canUseSkill(warrior, 'fireball').ok, false);

    const lowMp = { ...warrior, mp: 2 };
    assert.equal(canUseSkill(lowMp, 'cleave').reason, 'no_mp');

    const fractionalMp = { characterClass: 'mage', mp: 9.9, skillCooldowns: {} };
    assert.equal(canUseSkill(fractionalMp, 'fireball').reason, 'no_mp');
    assert.equal(canUseSkill({ ...fractionalMp, mp: 10.9 }, 'fireball').ok, true);

    const onCd = {
      ...warrior,
      skillCooldowns: { cleave: Date.now() },
    };
    assert.equal(canUseSkill(onCd, 'cleave', Date.now() + 100).reason, 'cooldown');
  });

  it('getAvailableMp floors fractional mp and rejects invalid values', () => {
    assert.equal(getAvailableMp({ mp: 9.9 }), 9);
    assert.equal(getAvailableMp({ mp: NaN }), 0);
    assert.equal(getAvailableMp({}), 0);
  });

  it('spendSkillMp deducts from floored mp', () => {
    const player = { mp: 10.9 };
    spendSkillMp(player, 8);
    assert.equal(player.mp, 2);
  });

  it('getSkillCooldownRemaining reports ms left', () => {
    const now = 10000;
    const player = {
      characterClass: 'mage',
      skillCooldowns: { fireball: now - 500 },
    };
    const remaining = getSkillCooldownRemaining(player, now);
    assert.equal(remaining.fireball, SKILLS.fireball.cooldownMs - 500);
  });

  it('calculateSkillDamage scales with stat', () => {
    const dmg = calculateSkillDamage(SKILLS.cleave, { str: 20, dex: 5, int: 5 });
    assert.ok(dmg >= 1);
    assert.ok(dmg >= 20);
  });

  it('findMonstersInRadius finds nearby targets', () => {
    const monsters = [
      { id: 'm1', x: 10, y: 0, hp: 10 },
      { id: 'm2', x: 100, y: 0, hp: 10 },
    ];
    const hits = findMonstersInRadius(monsters, 0, 0, 20);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].id, 'm1');
  });

  it('findMonstersInArc respects facing', () => {
    const monsters = [
      { id: 'front', x: 40, y: 0, hp: 10 },
      { id: 'behind', x: -40, y: 0, hp: 10 },
    ];
    const hits = findMonstersInArc(monsters, 0, 0, 50, 0, 60);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].id, 'front');
  });

  it('findMonsterAtGroundPoint picks monster near aim', () => {
    const monsters = [
      { id: 'm1', x: 100, y: 100, hp: 10 },
      { id: 'm2', x: 200, y: 200, hp: 10 },
    ];
    const hit = findMonsterAtGroundPoint(monsters, 0, 0, 102, 98, 200, 24);
    assert.equal(hit?.id, 'm1');
  });

  it('findFirstMonsterOnRay hits monster between caster and click', () => {
    const monsters = [{ id: 'm1', x: 130, y: 100, hp: 10 }];
    const shot = resolveProjectileImpact(monsters, 100, 100, 200, 100, 200, 24);
    assert.equal(shot.monster?.id, 'm1');
    assert.equal(shot.missed, false);
    assert.equal(shot.impactX, 130);
    assert.equal(shot.impactY, 100);
  });

  it('resolveProjectileImpact stops at max range on miss', () => {
    const shot = resolveProjectileImpact([], 0, 0, 300, 0, 200, 24);
    assert.equal(shot.missed, true);
    assert.equal(shot.impactX, 200);
    assert.equal(shot.impactY, 0);
  });
});
