import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS,
  createStatusEffect,
  applyStatusEffect,
  isStunned,
  getMovementSpeedMultiplier,
  tickStatusEffects,
  clearStatusEffects,
} from '../../../../shared/plugins/combat/statusEffects.js';

describe('statusEffects', () => {
  it('isStunned is true while stun effect is active', () => {
    const entity = {};
    applyStatusEffect(entity, createStatusEffect(STATUS.STUN, { now: 1000, durationMs: 500 }));
    assert.equal(isStunned(entity, 1200), true);
    assert.equal(isStunned(entity, 1600), false);
  });

  it('getMovementSpeedMultiplier halves speed when slowed', () => {
    const entity = {};
    applyStatusEffect(entity, createStatusEffect(STATUS.SLOW, { now: 0, durationMs: 5000 }));
    assert.equal(getMovementSpeedMultiplier(entity, 100), 0.5);
    assert.equal(getMovementSpeedMultiplier(entity, 6000), 1);
  });

  it('tickStatusEffects deals DoT on interval and removes expired effects', () => {
    const entity = {};
    applyStatusEffect(
      entity,
      createStatusEffect(STATUS.POISON, { now: 0, durationMs: 3000, damagePerTick: 4 })
    );

    assert.equal(tickStatusEffects(entity, 500), 0);
    assert.equal(tickStatusEffects(entity, 1000), 4);
    assert.equal(tickStatusEffects(entity, 2000), 4);
    assert.equal(tickStatusEffects(entity, 4000), 0);
    assert.equal(entity.statusEffects.length, 0);
  });

  it('clearStatusEffects resets the list', () => {
    const entity = { statusEffects: [{ type: STATUS.BLEED }] };
    clearStatusEffects(entity);
    assert.deepEqual(entity.statusEffects, []);
  });
});
