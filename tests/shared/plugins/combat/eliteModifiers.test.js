import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TYPE } from '../../../../shared/dungeon.js';
import {
  ELITE_MODIFIERS,
  rollEliteModifier,
  applyEliteModifier,
} from '../../../../shared/plugins/combat/eliteModifiers.js';
import { createMonster } from '../../../../server/entities/Monster.js';

describe('eliteModifiers', () => {
  it('rollEliteModifier returns null when roll is above spawn chance', () => {
    assert.equal(rollEliteModifier(() => 1), null);
  });

  it('rollEliteModifier picks a known modifier', () => {
    const id = rollEliteModifier(() => 0);
    assert.ok(id && ELITE_MODIFIERS[id]);
  });

  it('applyEliteModifier upgrades stats and label', () => {
    const monster = createMonster('goblin', 100, 100);
    const baseHp = monster.maxHp;
    applyEliteModifier(monster, 'champion');

    assert.equal(monster.isElite, true);
    assert.equal(monster.eliteModifier, 'champion');
    assert.ok(monster.label.includes('Champion'));
    assert.ok(monster.maxHp > baseHp);
    assert.ok(monster.xpReward > 10);
    assert.equal(monster.onHitStatus, 'bleed');
  });

  it('applyEliteModifier ignores bosses', () => {
    const monster = createMonster(BOSS_TYPE, 100, 100);
    const hp = monster.maxHp;
    applyEliteModifier(monster, 'extra_fast');
    assert.equal(monster.isElite, false);
    assert.equal(monster.maxHp, hp);
  });
});
