import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOOD_SIPHON_RANGE,
  getBloodSiphonHealAmount,
  isInBloodSiphonRange,
  tryBloodSiphon,
} from '../../shared/plugins/combat/bloodSiphon.js';
import { createPlayerStats } from '../../shared/stats.js';

function necro(overrides = {}) {
  const stats = createPlayerStats('necromancer', overrides.level ?? 1);
  return {
    characterClass: 'necromancer',
    x: 100,
    y: 100,
    dead: false,
    equipment: {},
    ...stats,
    ...overrides,
  };
}

describe('bloodSiphon', () => {
  it('heals only necromancers', () => {
    const warrior = { ...necro(), characterClass: 'warrior', hp: 50, maxHp: 120 };
    assert.equal(getBloodSiphonHealAmount(warrior), 0);
    assert.equal(tryBloodSiphon(warrior, { x: 100, y: 100 }), 0);
  });

  it('requires proximity to the slain monster', () => {
    const player = necro({ hp: 40, maxHp: 130 });
    assert.equal(isInBloodSiphonRange(player, { x: 100, y: 100 }), true);
    assert.equal(
      isInBloodSiphonRange(player, { x: 100 + BLOOD_SIPHON_RANGE + 1, y: 100 }),
      false
    );
    assert.equal(tryBloodSiphon(player, { x: 100 + BLOOD_SIPHON_RANGE + 20, y: 100 }), 0);
  });

  it('restores life when in range', () => {
    const player = necro({ hp: 40, maxHp: 130, vit: 16, level: 1 });
    const healed = tryBloodSiphon(player, { x: 120, y: 100 });
    assert.ok(healed >= 3);
    assert.equal(player.hp, 40 + healed);
  });

  it('does not exceed maxHp', () => {
    const player = necro({ hp: 128, maxHp: 130, vit: 20, level: 5 });
    const healed = tryBloodSiphon(player, { x: 100, y: 100 });
    assert.equal(player.hp, 130);
    assert.ok(healed <= 2);
  });
});
