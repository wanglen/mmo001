import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allocateStat } from '../../../server/systems/progression.js';
import { createPlayerStats } from '../../../shared/stats.js';
import { createEmptyEquipment } from '../../../shared/inventory.js';

function createMockPlayer() {
  const stats = createPlayerStats('warrior');
  grantXpHelper(stats);
  return {
    characterClass: 'warrior',
    equipment: createEmptyEquipment(),
    ...stats,
  };
}

function grantXpHelper(stats) {
  stats.xp = 100;
  stats.level = 2;
  stats.statPoints = 5;
}

describe('allocateStat', () => {
  it('allocates stat when points available', () => {
    const player = createMockPlayer();
    const result = allocateStat(player, 'str');
    assert.equal(result.ok, true);
    assert.equal(player.statPoints, 4);
    assert.equal(player.str, 16);
  });

  it('rejects when no stat points', () => {
    const player = createMockPlayer();
    player.statPoints = 0;
    const result = allocateStat(player, 'str');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'no_points');
  });
});
