import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDamage,
  canAttackNow,
  findMonsterAt,
  isInRange,
  isInAttackRange,
  ATTACK_COOLDOWN_MS,
  ATTACK_RANGE,
  ATTACK_RANGE_LEEWAY,
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
    assert.equal(isInRange(0, 0, 10, 0, 52), true);
    assert.equal(isInRange(0, 0, 100, 0, 52), false);
  });

  it('isInAttackRange allows server leeway beyond client melee range', () => {
    assert.equal(isInAttackRange(0, 0, ATTACK_RANGE, 0, 0), true);
    assert.equal(isInAttackRange(0, 0, ATTACK_RANGE + ATTACK_RANGE_LEEWAY, 0, ATTACK_RANGE_LEEWAY), true);
    assert.equal(isInAttackRange(0, 0, ATTACK_RANGE + ATTACK_RANGE_LEEWAY + 1, 0, ATTACK_RANGE_LEEWAY), false);
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
