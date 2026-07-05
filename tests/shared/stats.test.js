import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayerStats,
  xpToNextLevel,
  grantXp,
  allocateStatPoint,
  normalizeSavedProgression,
  STAT_POINTS_PER_LEVEL,
  BASE_STATS,
} from '../../shared/stats.js';

describe('stats', () => {
  it('createPlayerStats sets hp/mp from class base and vit/int', () => {
    const stats = createPlayerStats('warrior');
    assert.equal(stats.level, 1);
    assert.equal(stats.hp, stats.maxHp);
    assert.equal(stats.mp, stats.maxMp);
    assert.equal(stats.statPoints, 0);
    assert.ok(stats.maxHp >= BASE_STATS.warrior.hp);
  });

  it('mage has more mp than warrior', () => {
    const mage = createPlayerStats('mage');
    const warrior = createPlayerStats('warrior');
    assert.ok(mage.maxMp > warrior.maxMp);
    assert.ok(warrior.maxHp > mage.maxHp);
  });

  it('xpToNextLevel uses accelerating curve', () => {
    assert.equal(xpToNextLevel(1), 100);
    assert.ok(xpToNextLevel(5) > xpToNextLevel(2));
    assert.ok(xpToNextLevel(10) > xpToNextLevel(5));
  });

  it('grantXp adds xp without leveling when below threshold', () => {
    const stats = createPlayerStats('warrior');
    const result = grantXp(stats, 50, 'warrior');
    assert.equal(stats.xp, 50);
    assert.equal(stats.level, 1);
    assert.equal(result.levelsGained, 0);
  });

  it('grantXp grants stat points on level up', () => {
    const stats = createPlayerStats('warrior');
    const result = grantXp(stats, 100, 'warrior');
    assert.equal(stats.level, 2);
    assert.equal(stats.xp, 0);
    assert.equal(result.levelsGained, 1);
    assert.equal(stats.statPoints, STAT_POINTS_PER_LEVEL);
    assert.equal(stats.skillPoints, 0);
    assert.equal(stats.str, BASE_STATS.warrior.str);
    assert.equal(stats.hp, stats.maxHp);
  });

  it('normalizeSavedProgression merges legacy skill points into stat points', () => {
    const stats = createPlayerStats('warrior', 2, {
      statPoints: 3,
      skillPoints: 2,
    });
    assert.equal(stats.statPoints, 5);
    assert.equal(stats.skillPoints, 0);
  });

  it('allocateStatPoint spends a point and increases stat', () => {
    const stats = createPlayerStats('warrior');
    grantXp(stats, 100, 'warrior');
    const beforeHp = stats.maxHp;
    const result = allocateStatPoint(stats, 'vit', 'warrior');
    assert.equal(result.ok, true);
    assert.equal(stats.statPoints, STAT_POINTS_PER_LEVEL - 1);
    assert.equal(stats.vit, BASE_STATS.warrior.vit + 1);
    assert.ok(stats.maxHp > beforeHp);
  });
});
