import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMaxSummonSlots,
  MAX_SUMMON_SLOTS,
  pickSummonsToReplace,
  scaleSummonStats,
  getSummonDef,
  getSummonCastRange,
  SUMMON_CAST_RANGE_BASE,
  countOwnedSummonSlots,
} from '../../shared/summons.js';
import {
  canUseSkill,
  getAvailableHpForSkills,
  spendSkillHp,
  getSkillHpCost,
  getSkillResourceCost,
  SKILLS,
} from '../../shared/skills.js';
import { BASE_STATS } from '../../shared/stats.js';
import { CHARACTER_CLASSES } from '../../shared/constants.js';

describe('summons', () => {
  it('scales summon slots with level up to the hard cap', () => {
    assert.equal(getMaxSummonSlots(1), 1);
    assert.equal(getMaxSummonSlots(5), 1);
    assert.equal(getMaxSummonSlots(6), 2);
    assert.equal(getMaxSummonSlots(21), 5);
    assert.equal(getMaxSummonSlots(99), MAX_SUMMON_SLOTS);
  });

  it('scales summon cast range with level', () => {
    assert.equal(getSummonCastRange(1), SUMMON_CAST_RANGE_BASE);
    assert.ok(getSummonCastRange(10) > getSummonCastRange(1));
    assert.ok(getSummonCastRange(99) >= getSummonCastRange(20));
  });

  it('scales thrall HP and damage from owner VIT', () => {
    const def = getSummonDef('blood_thrall');
    const low = scaleSummonStats(def, { vit: 10, level: 1 });
    const high = scaleSummonStats(def, { vit: 30, level: 10 });
    assert.ok(high.hp > low.hp);
    assert.ok(high.damage > low.damage);
  });

  it('FIFO-replaces oldest thralls when over cap', () => {
    const owned = [
      { id: 'a', hp: 10, slotCost: 1, spawnedAt: 100 },
      { id: 'b', hp: 10, slotCost: 1, spawnedAt: 200 },
      { id: 'c', hp: 10, slotCost: 1, spawnedAt: 300 },
    ];
    assert.deepEqual(pickSummonsToReplace(owned, 1, 2), ['a', 'b']);
    assert.deepEqual(pickSummonsToReplace(owned, 1, 3), ['a']);
    assert.deepEqual(pickSummonsToReplace(owned, 1, 4), []);
    assert.equal(countOwnedSummonSlots(owned, 'owner'), 0);
    assert.equal(
      countOwnedSummonSlots(
        owned.map((s) => ({ ...s, isSummon: true, ownerId: 'p1' })),
        'p1'
      ),
      3
    );
  });
});

describe('blood necromancer skills', () => {
  it('registers the class and blood skill set', () => {
    assert.ok(CHARACTER_CLASSES.necromancer);
    assert.equal(BASE_STATS.necromancer.vit > BASE_STATS.mage.vit, true);
    assert.ok(SKILLS.blood_raise);
    assert.ok(SKILLS.sanguine_bolt);
    assert.equal(SKILLS.blood_raise.type, 'summon');
    assert.equal(SKILLS.exsanguinate.type, 'sacrifice');
  });

  it('gates blood skills on HP and never spends the last point', () => {
    const necro = {
      characterClass: 'necromancer',
      hp: 20,
      mp: 20,
      skillCooldowns: {},
      unlockedSkills: ['blood_raise', 'sanguine_bolt'],
    };

    assert.equal(getSkillHpCost(SKILLS.blood_raise), 18);
    assert.equal(getSkillResourceCost(SKILLS.blood_raise).unit, 'HP');
    assert.equal(canUseSkill(necro, 'blood_raise').ok, true);

    const lowHp = { ...necro, hp: 10 };
    assert.equal(canUseSkill(lowHp, 'blood_raise').reason, 'no_hp');
    assert.equal(getAvailableHpForSkills(lowHp), 9);

    const player = { hp: 5 };
    spendSkillHp(player, 10);
    assert.equal(player.hp, 1);
  });
});
