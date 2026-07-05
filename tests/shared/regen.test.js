import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tickMpRegen, MP_REGEN_PER_SEC } from '../../shared/regen.js';
import { createPlayerStats } from '../../shared/stats.js';

describe('regen', () => {
  it('tickMpRegen restores MP up to maxMp', () => {
    const stats = createPlayerStats('mage');
    stats.mp = 10;

    const gained = tickMpRegen(stats, 'mage', 2);
    const expected = MP_REGEN_PER_SEC.mage * 2;

    assert.ok(gained > 0);
    assert.equal(stats.mp, 10 + expected);
  });

  it('mage regens faster than warrior', () => {
    const mage = createPlayerStats('mage');
    const warrior = createPlayerStats('warrior');
    mage.mp = 0;
    warrior.mp = 0;

    tickMpRegen(mage, 'mage', 1);
    tickMpRegen(warrior, 'warrior', 1);

    assert.ok(mage.mp > warrior.mp);
  });

  it('tickMpRegen does not exceed maxMp', () => {
    const stats = createPlayerStats('mage');
    stats.mp = stats.maxMp - 0.1;

    tickMpRegen(stats, 'mage', 10);
    assert.equal(stats.mp, stats.maxMp);
  });
});
