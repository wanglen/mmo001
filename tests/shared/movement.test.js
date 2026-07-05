import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  directionFromDelta8,
  directionFromKeys,
  isValidDirection,
  toCardinalDirection,
  DIRECTION_DELTA,
} from '../../shared/movement.js';

describe('movement', () => {
  it('directionFromDelta8 snaps to 8 directions', () => {
    assert.equal(directionFromDelta8(10, 0), 'right');
    assert.equal(directionFromDelta8(10, 10), 'down-right');
    assert.equal(directionFromDelta8(0, -10), 'up');
    assert.equal(directionFromDelta8(-10, 10), 'down-left');
  });

  it('directionFromKeys supports diagonal chords', () => {
    assert.equal(
      directionFromKeys({ up: true, right: true, down: false, left: false }),
      'up-right'
    );
    assert.equal(
      directionFromKeys({ up: false, right: false, down: true, left: true }),
      'down-left'
    );
  });

  it('diagonal deltas are speed-normalized', () => {
    const d = DIRECTION_DELTA['down-right'];
    const length = Math.hypot(d.x, d.y);
    assert.ok(Math.abs(length - 3) < 0.01);
  });

  it('toCardinalDirection maps diagonals for sprites', () => {
    assert.equal(toCardinalDirection('up-left'), 'up');
    assert.equal(toCardinalDirection('down-right'), 'down');
    assert.equal(toCardinalDirection('left'), 'left');
  });

  it('isValidDirection rejects unknown directions', () => {
    assert.equal(isValidDirection('down-right'), true);
    assert.equal(isValidDirection('north'), false);
  });
});
