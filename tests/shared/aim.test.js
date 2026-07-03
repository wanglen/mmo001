import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  directionFromDelta,
  facingFromTarget,
  aimAngleFromTarget,
} from '../../shared/aim.js';

describe('aim', () => {
  it('directionFromDelta returns null for zero delta', () => {
    assert.equal(directionFromDelta(0, 0), null);
  });

  it('directionFromDelta picks horizontal when |dx| > |dy|', () => {
    assert.equal(directionFromDelta(10, 2), 'right');
    assert.equal(directionFromDelta(-5, 1), 'left');
  });

  it('directionFromDelta picks vertical when |dy| >= |dx|', () => {
    assert.equal(directionFromDelta(2, 10), 'down');
    assert.equal(directionFromDelta(-1, -8), 'up');
  });

  it('facingFromTarget computes direction from player to cursor', () => {
    assert.equal(facingFromTarget(100, 100, 200, 100), 'right');
    assert.equal(facingFromTarget(100, 100, 100, 50), 'up');
  });

  it('aimAngleFromTarget returns radians toward target', () => {
    assert.ok(Math.abs(aimAngleFromTarget(0, 0, 1, 0)) < 0.001);
    assert.ok(Math.abs(aimAngleFromTarget(0, 0, 0, 1) - Math.PI / 2) < 0.001);
  });
});
