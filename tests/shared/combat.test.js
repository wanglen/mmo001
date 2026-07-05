import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDamage,
  canAttackNow,
  findMonsterAt,
  isInRange,
  ATTACK_COOLDOWN_MS,
} from '../../shared/combat.js';

describe('combat', () => {
  it('calculateDamage scales with strength', () => {
    const low = calculateDamage(5, 0);
    const high = calculateDamage(15, 0);
    assert.ok(high > low);
    assert.ok(low >= 1);
  });

  it('canAttackNow respects cooldown', () => {
    const now = 10000;
    assert.equal(canAttackNow(now - ATTACK_COOLDOWN_MS, now), true);
    assert.equal(canAttackNow(now - 100, now), false);
  });

  it('isInRange checks distance threshold', () => {
    assert.equal(isInRange(0, 0, 10, 0, 48), true);
    assert.equal(isInRange(0, 0, 100, 0, 48), false);
  });

  it('findMonsterAt picks monster under cursor', () => {
    const monsters = [
      { id: 'm1', x: 100, y: 100, hp: 10 },
      { id: 'm2', x: 200, y: 200, hp: 10 },
    ];
    assert.equal(findMonsterAt(monsters, 102, 98)?.id, 'm1');
    assert.equal(findMonsterAt(monsters, 500, 500), null);
  });
});
