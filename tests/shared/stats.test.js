import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerStats, xpToNextLevel, BASE_STATS } from '../../shared/stats.js';

describe('stats', () => {
  it('createPlayerStats sets hp/mp from class base and vit/int', () => {
    const stats = createPlayerStats('warrior');
    assert.equal(stats.level, 1);
    assert.equal(stats.hp, stats.maxHp);
    assert.equal(stats.mp, stats.maxMp);
    assert.ok(stats.maxHp >= BASE_STATS.warrior.hp);
  });

  it('mage has more mp than warrior', () => {
    const mage = createPlayerStats('mage');
    const warrior = createPlayerStats('warrior');
    assert.ok(mage.maxMp > warrior.maxMp);
    assert.ok(warrior.maxHp > mage.maxHp);
  });

  it('stats scale with level', () => {
    const l1 = createPlayerStats('ranger', 1);
    const l5 = createPlayerStats('ranger', 5);
    assert.ok(l5.str > l1.str);
    assert.ok(l5.maxHp > l1.maxHp);
  });

  it('xpToNextLevel increases per level', () => {
    assert.equal(xpToNextLevel(1), 100);
    assert.ok(xpToNextLevel(5) > xpToNextLevel(1));
  });
});
