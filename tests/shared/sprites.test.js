import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSpriteFrame,
  getSourceRect,
  ANIMATION,
  SPRITE_FRAME_SIZE,
} from '../../shared/sprites.js';

describe('sprites', () => {
  it('resolveSpriteFrame returns idle when not moving', () => {
    const frame = resolveSpriteFrame({ moving: false }, 'down');
    assert.equal(frame.col, ANIMATION.IDLE);
    assert.equal(frame.row, 0);
  });

  it('resolveSpriteFrame alternates walk frames when moving', () => {
    const f0 = resolveSpriteFrame({ moving: true }, 'right', 0);
    const f1 = resolveSpriteFrame({ moving: true }, 'right', 1);
    assert.equal(f0.col, ANIMATION.WALK_0);
    assert.equal(f1.col, ANIMATION.WALK_1);
    assert.equal(f0.row, 3);
  });

  it('resolveSpriteFrame returns attack frame when attacking', () => {
    const frame = resolveSpriteFrame({ moving: true, attacking: true }, 'left');
    assert.equal(frame.col, ANIMATION.ATTACK);
    assert.equal(frame.row, 2);
  });

  it('getSourceRect computes atlas coordinates', () => {
    assert.deepEqual(getSourceRect(2, 1), {
      sx: 32,
      sy: 16,
      sw: SPRITE_FRAME_SIZE,
      sh: SPRITE_FRAME_SIZE,
    });
  });
});
