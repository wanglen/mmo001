import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterRevealedPositions,
  isPositionRevealed,
  isTileRevealed,
  revealTilesInRadius,
  revealTownZones,
  tileKey,
} from '../../shared/fog.js';
import { createTownZone } from '../../shared/zones.js';

describe('fog', () => {
  it('tileKey round-trips coordinates', () => {
    assert.equal(tileKey(3, 7), '3,7');
  });

  it('revealTilesInRadius marks a circular area', () => {
    const revealed = new Set();
    revealTilesInRadius(revealed, 5, 5, 2);
    assert.ok(revealed.has(tileKey(5, 5)));
    assert.ok(revealed.has(tileKey(7, 5)));
    assert.ok(!revealed.has(tileKey(8, 5)));
  });

  it('isTileRevealed stays true once explored', () => {
    const revealed = new Set([tileKey(20, 20)]);
    assert.ok(isTileRevealed(revealed, 20, 20));
    assert.ok(!isTileRevealed(revealed, 10, 10));
  });

  it('isPositionRevealed checks pixel foot position', () => {
    const revealed = new Set([tileKey(2, 3)]);
    assert.ok(isPositionRevealed(revealed, 2 * 32 + 16, 3 * 32 + 16, 32));
    assert.ok(!isPositionRevealed(revealed, 10 * 32, 10 * 32, 32));
  });

  it('filterRevealedPositions hides entities on fogged tiles', () => {
    const revealed = new Set([tileKey(0, 0)]);
    const entities = [
      { id: 'a', x: 16, y: 16 },
      { id: 'b', x: 320, y: 320 },
    ];
    const visible = filterRevealedPositions(revealed, entities, 32);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, 'a');
  });

  it('revealTownZones pre-reveals safe town tiles', () => {
    const revealed = new Set();
    const map = {
      width: 20,
      height: 20,
      zones: [createTownZone({ x: 10, y: 10 }, 20)],
    };
    revealTownZones(revealed, map);
    assert.ok(revealed.has(tileKey(10, 10)));
    assert.ok(revealed.has(tileKey(14, 10)));
    assert.ok(!revealed.has(tileKey(0, 0)));
  });
});
