import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  learnSkill,
  setSkillSlot,
  respecSkills,
  canLearnSkill,
  getDefaultUnlockedSkills,
  totalSkillPointsEarned,
  respecGoldCost,
  migratePlayerSkillState,
} from '../../../../shared/plugins/combat/skillTree.js';

function warriorPlayer(overrides = {}) {
  return {
    characterClass: 'warrior',
    level: 5,
    gold: 1000,
    skillPoints: 3,
    unlockedSkills: ['cleave', 'charge'],
    skillBarSlots: ['cleave', 'charge', null, null, null, null, null, null],
    skillCooldowns: { whirlwind: Date.now() },
    ...overrides,
  };
}

describe('skillTree', () => {
  it('getDefaultUnlockedSkills returns starter bar skills', () => {
    const skills = getDefaultUnlockedSkills('warrior');
    assert.deepEqual(skills, ['cleave', 'charge']);
  });

  it('canLearnSkill enforces prerequisites and points', () => {
    const player = warriorPlayer({ skillPoints: 0 });
    assert.equal(canLearnSkill(player, 'whirlwind').reason, 'no_points');

    const missingPrereq = warriorPlayer({ unlockedSkills: ['cleave'], skillPoints: 2 });
    assert.equal(canLearnSkill(missingPrereq, 'whirlwind').reason, 'missing_prerequisite');

    const ready = warriorPlayer({ skillPoints: 2 });
    assert.equal(canLearnSkill(ready, 'whirlwind').ok, true);
  });

  it('learnSkill spends points and unlocks skill', () => {
    const player = warriorPlayer({ skillPoints: 2 });
    const result = learnSkill(player, 'whirlwind');
    assert.equal(result.ok, true);
    assert.equal(player.skillPoints, 0);
    assert.ok(player.unlockedSkills.includes('whirlwind'));
  });

  it('setSkillSlot assigns unlocked skills to hotbar', () => {
    const player = warriorPlayer({
      unlockedSkills: ['cleave', 'charge', 'whirlwind'],
      skillPoints: 0,
    });
    const result = setSkillSlot(player, 2, 'whirlwind');
    assert.equal(result.ok, true);
    assert.equal(player.skillBarSlots[2], 'whirlwind');
  });

  it('setSkillSlot rejects skills that are not unlocked', () => {
    const player = warriorPlayer();
    const result = setSkillSlot(player, 2, 'whirlwind');
    assert.equal(result.reason, 'not_unlocked');
  });

  it('respecSkills resets unlocks and refunds points for gold', () => {
    const player = warriorPlayer({
      unlockedSkills: ['cleave', 'charge', 'whirlwind'],
      skillPoints: 0,
      gold: 500,
    });
    const cost = respecGoldCost(player.level);
    const result = respecSkills(player);
    assert.equal(result.ok, true);
    assert.equal(player.gold, 500 - cost);
    assert.deepEqual(player.unlockedSkills, getDefaultUnlockedSkills('warrior'));
    assert.equal(player.skillPoints, totalSkillPointsEarned(player.level));
    assert.deepEqual(player.skillCooldowns, {});
  });

  it('respecSkills fails without enough gold', () => {
    const player = warriorPlayer({ gold: 0 });
    assert.equal(respecSkills(player).reason, 'not_enough_gold');
  });

  it('migratePlayerSkillState infers skill points for legacy saves', () => {
    const player = { characterClass: 'warrior', level: 4, skillPoints: 0 };
    migratePlayerSkillState(player, {});
    assert.deepEqual(player.unlockedSkills, ['cleave', 'charge']);
    assert.equal(player.skillPoints, totalSkillPointsEarned(4));
  });
});
