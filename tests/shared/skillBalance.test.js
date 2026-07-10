import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_STATS } from '../../shared/stats.js';
import { ATTACK_COOLDOWN_MS, getMeleeDamageBounds } from '../../shared/combat.js';
import { SKILLS, getSkillDamageBounds } from '../../shared/skills.js';
import skillsData from '../../shared/content/skills.json' with { type: 'json' };

const CLASS_SKILLS = {
  warrior: ['cleave', 'shield_bash', 'charge', 'iron_will', 'whirlwind'],
  mage: ['fireball', 'icebolt', 'chain_spark', 'frost_nova', 'meteor'],
  ranger: ['arrow_shot', 'multishot', 'poison_arrow', 'piercing_shot'],
};

function combatStatsForClass(characterClass) {
  const base = BASE_STATS[characterClass];
  return {
    str: base.str,
    dex: base.dex,
    int: base.int,
    vit: base.vit,
    damagePercent: 0,
  };
}

function skillTier(skillId) {
  const skill = SKILLS[skillId];
  const classId = skill.classes[0];
  return skillsData.skillTrees[classId]?.[skillId]?.tier ?? 0;
}

function formatRange(min, max) {
  return `${min}-${max}`;
}

function avgDamage(min, max) {
  return (min + max) / 2;
}

function dps(min, max, cooldownMs) {
  return (avgDamage(min, max) * 1000) / cooldownMs;
}

describe('skillBalance', () => {
  it('level-1 tier-1 skills do not one-shot goblins at max damage', () => {
    const goblinHp = 40;
    const tier1 = ['cleave', 'fireball', 'arrow_shot', 'sanguine_bolt'];

    for (const skillId of tier1) {
      const skill = SKILLS[skillId];
      const characterClass = skill.classes[0];
      const bounds = getSkillDamageBounds(skill, combatStatsForClass(characterClass));
      assert.ok(bounds.max < goblinHp, `${skillId} max ${bounds.max} should stay below goblin HP`);
    }
  });

  it('tier-3 skills clearly out-damage tier-1 per cast', () => {
    const tier3 = [
      { classId: 'warrior', skillId: 'whirlwind', starterId: 'cleave' },
      { classId: 'mage', skillId: 'meteor', starterId: 'fireball' },
      { classId: 'ranger', skillId: 'piercing_shot', starterId: 'arrow_shot' },
    ];

    for (const { classId, skillId, starterId } of tier3) {
      const stats = combatStatsForClass(classId);
      const burst = getSkillDamageBounds(SKILLS[skillId], stats);
      const starter = getSkillDamageBounds(SKILLS[starterId], stats);

      assert.ok(
        burst.min >= starter.max + 4,
        `${skillId} min ${burst.min} should beat ${starterId} max ${starter.max} by a wide margin`
      );
    }
  });

  it('damage rises with skill tier within each class', () => {
    for (const [classId, skillIds] of Object.entries(CLASS_SKILLS)) {
      const stats = combatStatsForClass(classId);
      const byTier = skillIds
        .map((skillId) => ({
          skillId,
          tier: skillTier(skillId),
          avg: avgDamage(...Object.values(getSkillDamageBounds(SKILLS[skillId], stats)).slice(0, 2)),
        }))
        .sort((a, b) => a.tier - b.tier);

      const tier1 = byTier.filter((entry) => entry.tier === 1);
      const tier3 = byTier.filter((entry) => entry.tier === 3);
      const tier1Max = Math.max(...tier1.map((entry) => entry.avg));
      const tier3Min = Math.min(...tier3.map((entry) => entry.avg));

      assert.ok(tier3Min > tier1Max + 3, `${classId} tier-3 should hit much harder than tier-1`);
    }
  });

  it('utility skills trade raw damage for status or sustain', () => {
    const pairs = [
      { classId: 'warrior', baselineId: 'cleave', utilityId: 'iron_will' },
      { classId: 'mage', baselineId: 'fireball', utilityId: 'frost_nova' },
      { classId: 'ranger', baselineId: 'arrow_shot', utilityId: 'poison_arrow' },
    ];

    for (const { classId, baselineId, utilityId } of pairs) {
      const stats = combatStatsForClass(classId);
      const baseline = getSkillDamageBounds(SKILLS[baselineId], stats);
      const utility = getSkillDamageBounds(SKILLS[utilityId], stats);
      const utilitySkill = SKILLS[utilityId];

      assert.ok(
        avgDamage(utility.min, utility.max) <= avgDamage(baseline.min, baseline.max) + 1 ||
          utilitySkill.onHitStatus ||
          utilitySkill.selfHeal,
        `${utilityId} should offer utility when it does not beat ${baselineId} on damage`
      );
    }
  });

  it('prints level-1 balance table sorted by tier', () => {
    const rows = [];

    for (const [classId, skillIds] of Object.entries(CLASS_SKILLS)) {
      const stats = combatStatsForClass(classId);

      if (classId === 'warrior') {
        const melee = getMeleeDamageBounds({ str: stats.str });
        rows.push({
          class: classId,
          tier: '-',
          skill: 'Basic Attack',
          mp: 0,
          cd: `${ATTACK_COOLDOWN_MS / 1000}s`,
          damage: formatRange(melee.min, melee.max),
          crit: formatRange(melee.critMin, melee.critMax),
          dps: dps(melee.min, melee.max, ATTACK_COOLDOWN_MS).toFixed(1),
        });
      }

      for (const skillId of skillIds) {
        const skill = SKILLS[skillId];
        const bounds = getSkillDamageBounds(skill, stats);
        rows.push({
          class: classId,
          tier: skillTier(skillId),
          skill: skill.name,
          mp: skill.mpCost,
          cd: `${skill.cooldownMs / 1000}s`,
          damage: formatRange(bounds.min, bounds.max),
          crit: formatRange(bounds.critMin, bounds.critMax),
          dps: dps(bounds.min, bounds.max, skill.cooldownMs).toFixed(1),
        });
      }
    }

    rows.sort((a, b) => {
      if (a.class !== b.class) return a.class.localeCompare(b.class);
      if (a.tier === '-') return -1;
      if (b.tier === '-') return 1;
      return Number(a.tier) - Number(b.tier);
    });

    console.table(rows);
    assert.ok(rows.length >= 14);
    assert.ok(rows.some((row) => row.skill === 'Meteor'));
  });

  it('skill tree tiers are defined for every class skill', () => {
    for (const skillIds of Object.values(CLASS_SKILLS)) {
      for (const skillId of skillIds) {
        assert.ok(skillsData.skillTrees[SKILLS[skillId].classes[0]]?.[skillId]);
      }
    }
  });
});
