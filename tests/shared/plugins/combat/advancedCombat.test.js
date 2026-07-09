import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCritChance,
  getDodgeChance,
  applyResistance,
  resolvePlayerMeleeDamage,
  resolveMonsterHitOnPlayer,
  MELEE_STR_MULTIPLIER,
  CRIT_MULTIPLIER,
} from '../../../../shared/plugins/combat/advancedCombat.js';
import { MONSTER_TYPES } from '../../../../shared/monsters.js';
import { BASE_STATS } from '../../../../shared/stats.js';

describe('advancedCombat', () => {
  it('getCritChance scales with dex and caps at 50%', () => {
    assert.ok(getCritChance(0) < getCritChance(20));
    assert.ok(getCritChance(200) <= 0.5);
  });

  it('getDodgeChance scales with dex and caps at 40%', () => {
    assert.ok(getDodgeChance(0) === 0);
    assert.ok(getDodgeChance(200) <= 0.4);
  });

  it('applyResistance reduces damage and caps resistance', () => {
    assert.equal(applyResistance(100, 50), 50);
    assert.equal(applyResistance(100, 100), 25);
    assert.ok(applyResistance(1, 99) >= 1);
  });

  it('resolvePlayerMeleeDamage applies resistance and optional crit', () => {
    const resisted = resolvePlayerMeleeDamage({
      str: 10,
      dex: 0,
      defenderResistances: { fire: 50 },
      damageType: 'fire',
      random: () => 0.5,
    });
    assert.ok(resisted.damage >= 1);
    assert.equal(resisted.crit, false);

    const crit = resolvePlayerMeleeDamage({
      str: 10,
      dex: 0,
      random: () => 0,
    });
    assert.equal(crit.crit, true);
    assert.ok(
      crit.damage >= Math.floor(Math.floor(10 * MELEE_STR_MULTIPLIER) * CRIT_MULTIPLIER)
    );
  });

  it('level-1 warrior melee does not one-shot a goblin without crit', () => {
    const str = BASE_STATS.warrior.str;
    const goblinHp = MONSTER_TYPES.goblin.hp;
    const hit = resolvePlayerMeleeDamage({
      str,
      dex: BASE_STATS.warrior.dex,
      random: () => 0.99,
    });
    assert.equal(hit.crit, false);
    assert.ok(hit.damage < goblinHp);
  });

  it('resolveMonsterHitOnPlayer can dodge', () => {
    const dodged = resolveMonsterHitOnPlayer({
      baseDamage: 20,
      defenderDex: 200,
      random: () => 0,
    });
    assert.equal(dodged.dodged, true);
    assert.equal(dodged.damage, 0);
  });
});
