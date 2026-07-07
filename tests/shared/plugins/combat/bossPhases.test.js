import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBossPhase,
  getBossDamageMultiplier,
  getBossAttackCooldown,
} from '../../../../shared/plugins/combat/bossPhases.js';

function boss(hp, maxHp = 100) {
  return { isBoss: true, hp, maxHp };
}

describe('bossPhases', () => {
  it('getBossPhase transitions at 66% and 33% HP', () => {
    assert.equal(getBossPhase(boss(100)), 1);
    assert.equal(getBossPhase(boss(66)), 2);
    assert.equal(getBossPhase(boss(33)), 3);
    assert.equal(getBossPhase(boss(10)), 3);
  });

  it('getBossDamageMultiplier increases in later phases', () => {
    assert.equal(getBossDamageMultiplier(boss(100)), 1);
    assert.equal(getBossDamageMultiplier(boss(50)), 1.1);
    assert.equal(getBossDamageMultiplier(boss(20)), 1.3);
  });

  it('getBossAttackCooldown shortens from phase 2 onward', () => {
    const base = 1200;
    assert.equal(getBossAttackCooldown(base, boss(100)), base);
    assert.equal(getBossAttackCooldown(base, boss(50)), Math.floor(base * 0.85));
  });
});
