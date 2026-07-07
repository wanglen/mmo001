import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlayerMove, isLootPickupInRange } from '../../../../shared/plugins/core/anticheat.js';

describe('anticheat', () => {
  it('validatePlayerMove rejects moves that are too fast', () => {
    const player = { lastMoveAt: 1000 };
    const ok = validatePlayerMove(player, 'right', 1030);
    assert.equal(ok.ok, false);
    assert.equal(ok.reason, 'rate_limit');
  });

  it('validatePlayerMove accepts moves after cooldown', () => {
    const player = { lastMoveAt: 1000 };
    const ok = validatePlayerMove(player, 'right', 1100);
    assert.equal(ok.ok, true);
    assert.equal(ok.delta.x, 3);
  });

  it('isLootPickupInRange allows small tolerance', () => {
    assert.equal(isLootPickupInRange(0, 0, 30, 0, 28, 4), true);
    assert.equal(isLootPickupInRange(0, 0, 80, 0, 28, 4), false);
  });
});
